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
    allow_origins=["*"], # Permite peticiones desde cualquier sitio (Angular)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    
)
# --- SEGURIDAD: Validación de Token ---
def verificar_token(authorization: str = Header(None)):
    # En un caso real aquí decodificarías el JWT. Para el ejercicio, checkeamos que exista.
    if authorization is None:
        raise HTTPException(status_code=401, detail="Token no enviado")
    return authorization

# Dependencia de DB
def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- CRUD ALUMNOS ---
@app.get("/alumnos.php", response_model=List[schemas.Alumno])
def leer_alumnos(db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    db_alumnos = db.query(models.Alumno).all()
    for a in db_alumnos:
        a.centro_nombre = a.entidad.entidad if a.entidad else ""
        a.ciclo_nombre = a.ciclo.ciclo if a.ciclo else ""
        # Sacamos el nombre de la empresa de la vacante asignada
        if a.asignacion:
            a.vacante_asignada = a.asignacion[0].entidad.entidad
    return db_alumnos

@app.post("/alumnos.php", response_model=schemas.Alumno)
def crear_alumno(alumno: schemas.AlumnoCreate, db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    nuevo_alumno = models.Alumno(**alumno.model_dump())
    db.add(nuevo_alumno)
    db.commit()
    db.refresh(nuevo_alumno)
    return nuevo_alumno

# --- CRUD VACANTES ---
@app.get("/vacantes.php", response_model=List[schemas.Vacante])
def leer_vacantes(db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    db_vacantes = db.query(models.Vacante).all()
    for v in db_vacantes:
        v.entidad_nombre = v.entidad.entidad
        v.ciclo_nombre = v.ciclo.ciclo
        v.num_alumnos = len(v.alumnos) # Campo calculado
        v.listado_alumnos = [f"{a.nombre} {a.apellidos}" for a in v.alumnos] # Nombres para tabla auxiliar
    return db_vacantes

@app.post("/vacantes.php/asignar/{vacante_id}/{alumno_id}")
def asignar_alumno(vacante_id: int, alumno_id: int, db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    # 1. Buscamos la vacante y el alumno
    v = db.query(models.Vacante).filter(models.Vacante.id_vacante == vacante_id).first()
    a = db.query(models.Alumno).filter(models.Alumno.id_alumno == alumno_id).first()
    
    # Verificamos que existan
    if not v or not a:
        raise HTTPException(status_code=404, detail="Vacante o Alumno no encontrado")
    
    # 2. Validar misma ciclo y curso (REQUISITO ENUNCIADO)
    # Usamos type: ignore para evitar el aviso de ColumnElement
    if v.id_ciclo != a.id_ciclo or v.curso != a.curso:  # type: ignore
        raise HTTPException(status_code=400, detail="Ciclo o curso no coinciden")
    
    # 3. Validar plazas (len() sobre la relación funciona bien)
    if len(v.alumnos) >= v.num_plazas:  # type: ignore
        raise HTTPException(status_code=400, detail="No hay plazas libres")

    # 4. Evitar duplicados (UNIQUE id_alumno en la intermedia)
    ya_asignado = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_alumno == alumno_id).first()
    if ya_asignado:
        raise HTTPException(status_code=400, detail="Este alumno ya tiene una vacante")

    nueva_asig = models.VacanteAlumno(id_vacante=vacante_id, id_alumno=alumno_id)
    db.add(nueva_asig)
    db.commit()
    
    return {"status": "Asignado correctamente"}

@app.delete("/alumnos.php/{alumno_id}")
def borrar_alumno(alumno_id: int, db: Session = Depends(get_db), token: str = Depends(verificar_token)):
    db_alumno = db.query(models.Alumno).get(alumno_id)
    if db_alumno:
        db.delete(db_alumno)
        db.commit()
    return {"message": "ok"}