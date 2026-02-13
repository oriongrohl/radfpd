from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SGE - Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verificar_token(authorization: str = Header(None)):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Token no enviado")
    return authorization

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- ALUMNOS ---
@app.get("/alumnos.php", response_model=List[schemas.Alumno])
def leer_alumnos(db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    db_alumnos = db.query(models.Alumno).all()
    for a in db_alumnos:
        a.centro_nombre = a.entidad.entidad if a.entidad else ""
        a.ciclo_nombre = a.ciclo.ciclo if a.ciclo else ""
        if a.asignacion:
            # Mostramos el nombre de la empresa de la primera vacante encontrada
            a.vacante_asignada = a.asignacion[0].entidad.entidad
    return db_alumnos

@app.get("/alumnos.php/libres", response_model=List[schemas.Alumno])
def leer_alumnos_libres(db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    ocupados = db.query(models.VacanteAlumno.id_alumno).all()
    lista_ids_ocupados = [id_tup[0] for id_tup in ocupados]
    
    query = db.query(models.Alumno)
    if lista_ids_ocupados:
        query = query.filter(models.Alumno.id_alumno.not_in(lista_ids_ocupados)) # type: ignore
    
    return query.all()

@app.post("/alumnos.php", response_model=schemas.Alumno)
def crear_alumno(alumno: schemas.AlumnoCreate, db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    nuevo_alumno_dict = alumno.model_dump()
    nuevo_alumno_dict['id_entidad'] = 1 # Forzado por requisito
    nuevo_alumno = models.Alumno(**nuevo_alumno_dict)
    db.add(nuevo_alumno)
    db.commit()
    db.refresh(nuevo_alumno)
    return nuevo_alumno

# --- VACANTES ---
@app.get("/vacantes.php", response_model=List[schemas.Vacante])
def leer_vacantes(db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    db_vacantes = db.query(models.Vacante).all()
    res = []
    for v in db_vacantes:
        res.append({
            **v.__dict__,
            "entidad_nombre": v.entidad.entidad if v.entidad else "",
            "ciclo_nombre": v.ciclo.ciclo if v.ciclo else "",
            "num_alumnos": len(v.alumnos), # type: ignore
            "listado_alumnos": [f"{a.nombre} {a.apellidos}" for a in v.alumnos] # type: ignore
        })
    return res

@app.post("/vacantes.php", response_model=schemas.Vacante)
def crear_vacante(vacante: schemas.VacanteCreate, db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    nueva_vacante = models.Vacante(**vacante.model_dump())
    db.add(nueva_vacante)
    db.commit()
    db.refresh(nueva_vacante)
    return nueva_vacante

@app.put("/vacantes.php/{id_vacante}", response_model=schemas.Vacante)
def actualizar_vacante(id_vacante: int, datos: schemas.VacanteUpdate, db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    v = db.query(models.Vacante).filter(models.Vacante.id_vacante == id_vacante).first()
    if not v: raise HTTPException(status_code=404, detail="Vacante no encontrada")
    
    ocupacion = len(v.alumnos) # type: ignore
    if datos.num_vacantes < ocupacion:
        raise HTTPException(status_code=400, detail=f"No puedes bajar a {datos.num_vacantes} plazas, hay {ocupacion} alumnos.")
    
    v.num_vacantes = datos.num_vacantes # type: ignore
    db.commit()
    db.refresh(v)
    return {**v.__dict__, "num_alumnos": ocupacion}

# --- ASIGNACIONES ---
@app.post("/vacantes.php/asignar/{vacante_id}/{alumno_id}")
def asignar_alumno(vacante_id: int, alumno_id: int, db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    v = db.query(models.Vacante).get(vacante_id)
    a = db.query(models.Alumno).get(alumno_id)
    
    if not v or not a: raise HTTPException(status_code=404, detail="No existe vacante o alumno")
    
    if v.id_ciclo != a.id_ciclo or v.curso != a.curso: # type: ignore
        raise HTTPException(status_code=400, detail="Ciclo o curso no coinciden")
    
    if len(v.alumnos) >= v.num_vacantes: # type: ignore
        raise HTTPException(status_code=400, detail="Vacante completa")

    if not (1 <= v.id_ciclo <= 9): # type: ignore
        raise HTTPException(status_code=400, detail="Solo ciclos de tecnología (1-9)")

    nueva = models.VacanteAlumno(id_vacante=vacante_id, id_alumno=alumno_id)
    db.add(nueva)
    db.commit()
    return {"status": "ok"}

# --- CICLOS ---
@app.get("/ciclos.php", response_model=List[schemas.Ciclo])
def leer_ciclos(solo_tecnologia: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.Ciclo)
    if solo_tecnologia:
        query = query.filter(models.Ciclo.id_ciclo <= 9)
    return query.all()

@app.delete("/alumnos.php/{alumno_id}")
def borrar_alumno(alumno_id: int, db: Session = Depends(get_db)):
    # Borramos primero sus asignaciones para evitar error de FK
    db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_alumno == alumno_id).delete()
    db.query(models.Alumno).filter(models.Alumno.id_alumno == alumno_id).delete()
    db.commit()
    return {"message": "ok"}