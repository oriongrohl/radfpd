from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import models, schemas
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SGE - RAD FPD")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Configuracion CORS para permitir comunicacion con el frontend sin cuestionar origines de las peticiones (solo en desarrollo)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencia de DB
def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def verificar_token(authorization: str = Header(None)):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Token no enviado")
    return authorization

# --- AUXILIARES (Para Desplegables) ---

@app.get("/ciclos", response_model=List[schemas.Ciclo])
def leer_ciclos_tecnologia(solo_tecnologia: bool = False, db: Session = Depends(get_db)):
    # Solo devuelve ciclos con ID entre 1 y 9 (Tecnología)
    return db.query(models.Ciclo).filter(models.Ciclo.id_ciclo >= 1, models.Ciclo.id_ciclo <= 9).all()

@app.get("/alumnos-libres", response_model=List[schemas.Alumno])
def leer_alumnos_libres(db: Session = Depends(get_db)):
    # Devuelve alumnos que NO están en la tabla sgi_vacantes_x_alumnos
    ocupados = db.query(models.VacanteAlumno.id_alumno).subquery()
    return db.query(models.Alumno).filter(models.Alumno.id_alumno.not_in(ocupados)).all() # type: ignore


# --- CRUD ALUMNOS ---

@app.get("/alumnos", response_model=List[schemas.Alumno])
def leer_alumnos(db: Session = Depends(get_db)):
    db_alumnos = db.query(models.Alumno).all()
    for a in db_alumnos:
        a.centro_nombre = a.entidad.entidad if a.entidad else ""
        a.ciclo_nombre = a.ciclo.ciclo if a.ciclo else ""
    return db_alumnos

@app.post("/alumnos", response_model=schemas.Alumno)
def crear_alumno(alumno: schemas.AlumnoCreate, db: Session = Depends(get_db)):
    if not (1 <= alumno.id_ciclo <= 9):
        raise HTTPException(status_code=400, detail="Solo se permiten ciclos de tecnología (1-9)")
    # comprobar que el dni tenga formato correcto (8 dígitos + letra)
    if len(alumno.nif_nie) != 9 or not alumno.nif_nie[:8].isdigit() or not alumno.nif_nie[8].isalpha():
        raise HTTPException(status_code=400, detail="El NIF/NIE debe tener 8 dígitos seguidos de una letra")
    nuevo_dict = alumno.model_dump()
    nuevo_dict['id_entidad'] = 1  # Forzado por requisito
    nuevo_alumno = models.Alumno(**nuevo_dict)
    db.add(nuevo_alumno)
    db.commit()
    db.refresh(nuevo_alumno)
    return nuevo_alumno

@app.put("/alumnos/{id_alumno}", response_model=schemas.Alumno)
def actualizar_alumno(id_alumno: int, datos: schemas.AlumnoCreate, db: Session = Depends(get_db)):
    a = db.query(models.Alumno).get(id_alumno)
    if not a: raise HTTPException(status_code=404)
    for key, value in datos.model_dump().items():
        setattr(a, key, value)
    a.id_entidad = 1 # type: ignore # Nos aseguramos que siga siendo 1
    db.commit()
    return a

@app.delete("/alumnos/{id_alumno}")
def borrar_alumno(id_alumno: int, db: Session = Depends(get_db)):
    # Borrar primero asignaciones
    db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_alumno == id_alumno).delete()
    db.query(models.Alumno).filter(models.Alumno.id_alumno == id_alumno).delete()
    db.commit()
    return {"status": "ok"}


# --- CRUD VACANTES ---

@app.get("/vacantes")
def leer_vacantes(db: Session = Depends(get_db)):
    vacantes = db.query(models.Vacante).all()
    res = []
    for v in vacantes:
        # SQL COUNT real de la ocupación
        num_ocupados = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_vacante == v.id_vacante).count()
        res.append({
            "id_vacante": v.id_vacante,
            "entidad_nombre": v.entidad.entidad if v.entidad else "",
            "ciclo_nombre": v.ciclo.ciclo if v.ciclo else "",
            "num_vacantes": v.num_vacantes,
            "num_alumnos": num_ocupados,
            "curso": v.curso,
            "id_entidad": v.id_entidad,
            "id_ciclos": v.id_ciclos
        })
    return res

@app.get("/vacantes-disponibles")
def leer_vacantes_disponibles(db: Session = Depends(get_db)):
    """Devuelve vacantes que aún tienen plazas libres"""
    todas = db.query(models.Vacante).all()
    disponibles = []
    for v in todas:
        ocupadas = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_vacante == v.id_vacante).count()
        if ocupadas < v.num_vacantes: # type: ignore
            disponibles.append({
                "id_vacante": v.id_vacante,
                "nombre_mostrar": f"{v.entidad.entidad} - {v.ciclo.ciclo} ({v.num_vacantes - ocupadas} libres)"
            })
    return disponibles


@app.post("/vacantes", response_model=schemas.Vacante)
def crear_vacante(vacante: schemas.VacanteCreate, db: Session = Depends(get_db)):
    nueva = models.Vacante(**vacante.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@app.put("/vacantes/{id_vacante}")
def actualizar_vacante(id_vacante: int, datos: schemas.VacanteCreate, db: Session = Depends(get_db)):
    v = db.query(models.Vacante).get(id_vacante)
    if not v: raise HTTPException(status_code=404)
    
    num_ocupados = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_vacante == id_vacante).count()
    if datos.num_vacantes < num_ocupados:
        raise HTTPException(status_code=400, detail=f"No puedes bajar a {datos.num_vacantes} plazas, ya hay {num_ocupados} alumnos asignados.")
    
    update_data = datos.model_dump()
    for key, value in update_data.items():
        setattr(v, key, value)
    
    db.commit()
    db.refresh(v)
    return v

@app.delete("/vacantes/{id_vacante}")
def borrar_vacante(id_vacante: int, db: Session = Depends(get_db)):
    # Impedir borrar si hay alumnos asignados (opcional, pero recomendado)
    tiene_alumnos = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_vacante == id_vacante).first()
    if tiene_alumnos:
        raise HTTPException(status_code=400, detail="No puedes borrar una vacante que tiene alumnos asignados")
    db.query(models.Vacante).filter(models.Vacante.id_vacante == id_vacante).delete()
    db.commit()
    return {"status": "ok"}


# --- CRUD ASIGNACIONES (sgi_vacantes_x_alumnos) ---

@app.get("/asignaciones")
def leer_asignaciones(db: Session = Depends(get_db)):
    asigs = db.query(models.VacanteAlumno).all()
    return [{
        "id_vacante_x_alumno": a.id_vacante_x_alumno,
        "id_vacante": a.id_vacante,
        "id_alumno": a.id_alumno,
        "alumno_nombre": f"{a.alumno.nombre} {a.alumno.apellidos}",
        "empresa_nombre": a.vacante.entidad.entidad,
        "ciclo_nombre": a.vacante.ciclo.ciclo, # para poder ver en asignaciones el ciclo y curso sin tener que hacer joins adicionales
        "curso": a.vacante.curso
    } for a in asigs]

@app.post("/asignaciones")
def crear_asignacion(asig: schemas.AsignacionCreate, db: Session = Depends(get_db)):
    # 1 verificar si el alumno ya está en cualquier asignación
    # (El unique=True en el modelo ya lo protege, pero esto da un error limpio al frontend)
    existe = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_alumno == asig.id_alumno).first()
    if existe: 
        raise HTTPException(status_code=400, detail="Este alumno ya está asignado a otra vacante.")
    
    # 2. Verificar cupo de la vacante
    v = db.query(models.Vacante).get(asig.id_vacante)
    if not v:
        raise HTTPException(status_code=404, detail="La vacante no existe.")
        
    num_ocupados = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_vacante == asig.id_vacante).count()
    if num_ocupados >= v.num_vacantes: # type: ignore
        raise HTTPException(status_code=400, detail="Lo sentimos, no quedan plazas libres en esta vacante.")
    
    # 3. Crear asignación
    nueva = models.VacanteAlumno(id_vacante=asig.id_vacante, id_alumno=asig.id_alumno)
    db.add(nueva)
    db.commit()
    return {"status": "ok", "message": "Asignación realizada correctamente"}

@app.delete("/asignaciones/{id_asig}")
def borrar_asignacion(id_asig: int, db: Session = Depends(get_db)):
    db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_vacante_x_alumno == id_asig).delete()
    db.commit()
    return {"status": "ok"}

@app.get("/entidades")
def leer_entidades(db: Session = Depends(get_db)):
    # Devuelve todas las empresas para el desplegable de vacantes
    return db.query(models.Entidad).all()

@app.get("/ciclos")
def leer_ciclos_completo(db: Session = Depends(get_db)):
    # Devuelve todos los ciclos para el desplegable de vacantes
    return db.query(models.Ciclo).all()

    