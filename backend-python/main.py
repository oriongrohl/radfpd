from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
# para usar funciones SQL como COUNT en consultas con SQLAlchemy.ELIJO SQL ALCHEMY POR QUE ME PERMITE ESCRIBIR CONSULTAS DE MANERA MÁS PYTHONICA Y ORIENTADA A OBJETOS, EN LUGAR DE ESCRIBIR SQL PURO. ESTO HACE QUE EL CÓDIGOS SEA MÁS LEGIBLE Y MANTENIBLE, ADEMÁS DE PROPORCIONAR UNA CAPA DE ABSTRACCIÓN SOBRE LA BASE DE DATOS, LO QUE FACILITA EL CAMBIO DE MOTOR DE BASE DE DATOS EN EL FUTURO SI FUERA NECESARIO.
#? sqlalchemy permite ABSTRACCION DE LA BDD MAS PYTHONICO Y ORIENTADO A OBJETOS en vez de SQL puro. 
# Esto hace que el código sea más legible y mantenible, además de proporcionar una capa de abstracción sobre la base de datos, lo que facilita el cambio de motor de base de datos en el futuro si fuera necesario.
from sqlalchemy import func
from typing import List
import models, schemas
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SGE - RAD FPD") #? Título de la API (http://localhost:8000/docs)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], #? SOLO EN DESARROLLO Configuracion CORS para permitir comunicacion con el frontend sin cuestionar origines de las peticiones (solo en desarrollo)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencia de DB
#? se abre sesion por request -> se cierra automaticamente al finalizar la petición (incluso si hay error) para evitar conexiones abiertas innecesariamente. Esto es importante para mantener el rendimiento y la estabilidad de la aplicación, especialmente cuando hay muchas peticiones concurrentes.
def get_db(): # CONEXION BDD: cada vez que una ruta necesite acceder a la base de datos, llamará a esta función para obtener una sesión de DB. La función se encarga de abrir la sesión al inicio de la petición y cerrarla al final, incluso si ocurre un error.
    db = SessionLocal() # SESION COMO CONEXION: uso para hacer consultas - Creamos una sesión de base de datos para cada petición (una sesion es como una conexion a la BDD que se puede usar para hacer consultas y transacciones)
    try: yield db # La palabra clave yield convierte esta función en un generador, lo que permite usarla como una dependencia en FastAPI. Cuando una ruta depende de get_db, FastAPI ejecuta el código antes del yield para obtener la sesión de DB y luego ejecuta el código después del yield (en este caso, cerrar la sesión) automáticamente al finalizar la petición, incluso si ocurre un error durante el procesamiento de la ruta.
    finally: db.close() # SE CIERRA la sesión de base de datos al finalizar la petición para liberar recursos y evitar conexiones abiertas innecesariamente. Esto es importante para mantener el rendimiento y la estabilidad de la aplicación, especialmente cuando hay muchas peticiones concurrentes.

def verificar_token(authorization: str = Header(None)): # DEPENDENCIA DE AUTENTICACION: Si no se envia el token lanza HTTP 401 (no está autorizado)
    if authorization is None: # comprueba existencia del token que significa que el usuario está autenticado. Si no se envía el token, se lanza una excepción HTTP 401 (Unauthorized) indicando que el token no fue enviado. Esto es una medida de seguridad para proteger las rutas que requieren autenticación, asegurando que solo los usuarios autorizados puedan acceder a ellas.
        raise HTTPException(status_code=401, detail="Token no enviado")
    return authorization # UN TOKEN ES UNA CADENA DE TEXTO QUE SE UTILIZA PARA VERIFICAR LA IDENTIDAD DE UN USUARIO O APLICACIÓN. EN ESTE CASO, SE ESPERA QUE EL TOKEN SE ENVÍE EN EL ENCABEZADO DE AUTORIZACIÓN DE LA PETICIÓN HTTP. SI EL TOKEN ESTÁ PRESENTE, LA FUNCIÓN LO DEVUELVE PARA QUE PUEDA SER UTILIZADO EN LAS RUTAS PROTEGIDAS PARA VERIFICAR LA AUTENTICIDAD DEL USUARIO O APLICACIÓN QUE REALIZA LA PETICIÓN. SI EL TOKEN NO ESTÁ PRESENTE, SE LANZA UNA EXCEPCIÓN HTTP 401 (UNAUTHORIZED) INDICANDO QUE EL TOKEN NO FUE ENVIADO, LO QUE IMPLICA QUE EL USUARIO NO ESTÁ AUTORIZADO PARA ACCEDER A ESA RUTA.

# --- AUXILIARES (Para Desplegables) ---

@app.get("/ciclos", response_model=List[schemas.Ciclo])
def leer_ciclos_tecnologia(solo_tecnologia: bool = False, db: Session = Depends(get_db)):
    # Solo devuelve ciclos con ID entre 1 y 9 (Tecnología)
    return db.query(models.Ciclo).filter(models.Ciclo.id_ciclo >= 1, models.Ciclo.id_ciclo <= 9).all()

@app.get("/alumnos-libres", response_model=List[schemas.Alumno])
def leer_alumnos_libres(db: Session = Depends(get_db)):
    #? evitar asignaciones duplicadas
    ocupados = db.query(models.VacanteAlumno.id_alumno).subquery() #! OCUPADOS = alumnos cuyo id NO ESTÁ en Asignacion.id_alumno
    return db.query(models.Alumno).filter(models.Alumno.id_alumno.not_in(ocupados)).all() # type: ignore #! WHERE alumno.id NOT IN ocupados


# --- CRUD ALUMNOS ---

@app.get("/alumnos", response_model=List[schemas.Alumno])
def leer_alumnos(db: Session = Depends(get_db)):
    db_alumnos = db.query(models.Alumno).all()
    for a in db_alumnos:
        if a.entidad:
            a.centro_nombre = a.entidad.entidad #! centro_nombre está en schemas (atributo añadido en memoria
        else:
            a.centro_nombre = ""
        # enriquecimiento de datos para mostrar el nombre del centro educativo en lugar del ID
        a.ciclo_nombre = a.ciclo.ciclo if a.ciclo else ""
    return db_alumnos #? enriquecimiento de datos para mostrar nombre en vez de id al mandandolo al frontend directamente

@app.post("/alumnos", response_model=schemas.Alumno)
def crear_alumno(alumno: schemas.AlumnoCreate, db: Session = Depends(get_db)):
    if not (1 <= alumno.id_ciclo <= 9): # solo tecnología
        raise HTTPException(status_code=400, detail="Solo se permiten ciclos de tecnología (1-9)")
    # comprobar que el dni tenga formato correcto (8 dígitos + letra)
    if len(alumno.nif_nie) != 9 or not alumno.nif_nie[:8].isdigit() or not alumno.nif_nie[8].isalpha(): #? validacion basica formato DNI
        raise HTTPException(status_code=400, detail="El NIF/NIE debe tener 8 dígitos seguidos de una letra")
    nuevo_dict = alumno.model_dump()
    entidad = db.query(models.Entidad).filter(models.Entidad.id_entidad == alumno.id_entidad).first()
    if not entidad or entidad.id_tipo_entidad != 1: # type: ignore
        raise HTTPException(status_code=400, detail="La entidad seleccionada debe ser un Centro Educativo.") #! Nos aseguramos que siga siendo 1 centro educativo
    
    #! Forzado por requisito = UN ALUMNO SOLO PUEDE PERTENECER A ENTIDAD CENTRO EDUCATIVO
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
    entidad = db.query(models.Entidad).filter(models.Entidad.id_entidad == datos.id_entidad).first() # type: ignore
    if not entidad or entidad.id_tipo_entidad != 1: # type: ignore
        raise HTTPException(status_code=400, detail="La entidad seleccionada debe ser un Centro Educativo.") #! Nos aseguramos que siga siendo 1 centro educativo
    
    # si existe una asignación para este alumno, verificar que el ciclo y curso siguen coincidiendo con la vacante asignada
    asignacion = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_alumno == id_alumno).first()
    if asignacion:
        vacante = db.query(models.Vacante).get(asignacion.id_vacante)
        if vacante and (a.id_ciclo != vacante.id_ciclos or a.curso != vacante.curso): # type: ignore
            raise HTTPException(status_code=400, detail="No puedes cambiar el ciclo o curso porque el alumno ya está asignado a una vacante que no coincide con esos datos.")
    
    db.commit()
    return a

@app.delete("/alumnos/{id_alumno}")
def borrar_alumno(id_alumno: int, db: Session = Depends(get_db)):
    # Borrar primero asignaciones
    db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_alumno == id_alumno).delete() # ! Primero se eliminan las asignaciones relacionadas con el alumno para evitar errores de integridad referencial (foreign key) al intentar borrar un alumno que todavía está asignado a una vacante. Esto asegura que no queden registros huérfanos en la tabla de asignaciones que hagan referencia a un alumno que ya no existe.
    db.query(models.Alumno).filter(models.Alumno.id_alumno == id_alumno).delete() # borra alumno
    db.commit()
    return {"status": "ok"}


# --- CRUD VACANTES ---

@app.get("/vacantes")
def leer_vacantes(db: Session = Depends(get_db)):
    vacantes = db.query(models.Vacante).all()
    res = []
    for v in vacantes:
        # SQL COUNT real de la ocupación
        #! se hace un count en asignaciones para ver cuantas plazas hay ya ocupadas en cada vacante
        num_ocupados = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_vacante == v.id_vacante).count()
        res.append({
            "id_vacante": v.id_vacante,
            "entidad_nombre": v.entidad.entidad if v.entidad else "",
            "ciclo_nombre": v.ciclo.ciclo if v.ciclo else "",
            "num_vacantes": v.num_vacantes,
            "num_alumnos": num_ocupados, #? se pasa esto a la variable de la BDD para que aparezca en el frontend en directo cada vez que se haga get vacantes
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
        if ocupadas < v.num_vacantes: # type: ignore #? solo pasa a la lista de disponibles si el numero de ocupados es menor que el numero total de vacantes, es decir, si quedan plazas libres en esa vacante
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
    # si se intenta reducir el número de vacantes, verificar que no haya ya más alumnos asignados de los que se quieren permitir
    num_ocupados = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_vacante == id_vacante).count() 
    if datos.num_vacantes < num_ocupados: #! error 400 si se intenta reducir el número de vacantes por el count de asignaciones a esa vacante
        raise HTTPException(status_code=400, detail=f"No puedes bajar a {datos.num_vacantes} plazas, ya hay {num_ocupados} alumnos asignados.")
    
    update_data = datos.model_dump()
    for key, value in update_data.items():
        setattr(v, key, value) # Actualiza los atributos de la vacante con los nuevos datos proporcionados en la solicitud. Esto permite modificar cualquier campo de la vacante, como el número de plazas, el ciclo, la entidad, etc. Sin embargo, antes de hacer esto, se verifica que si se está reduciendo el número de plazas, no sea menor que el número de alumnos ya asignados a esa vacante para evitar inconsistencias en los datos.
    
    # no poder cambiar el ciclo o curso si ya hay alumnos asignados que no coincidirían con esos cambios
    if num_ocupados > 0: #? si hay asignaciones
        asignaciones = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_vacante == id_vacante).all()
        for a in asignaciones:
            alumno = db.query(models.Alumno).get(a.id_alumno)
            if alumno and (alumno.id_ciclo != v.id_ciclos or alumno.curso != v.curso): # type: ignore #! error si un alumno asignado no coincide con el nuevo ciclo o curso de la vacante
                raise HTTPException(status_code=400, detail="No puedes cambiar el ciclo o curso porque ya hay alumnos asignados que no coinciden con esos datos.")
    
    db.commit()
    db.refresh(v)
    return v

@app.delete("/vacantes/{id_vacante}")
def borrar_vacante(id_vacante: int, db: Session = Depends(get_db)):
    # Impedir borrar si hay alumnos asignados (opcional, pero recomendado)
    tiene_alumnos = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_vacante == id_vacante).first()
    if tiene_alumnos: #! no se puede borrar una vacante si tiene alumnos asignados
        raise HTTPException(status_code=400, detail="No puedes borrar una vacante que tiene alumnos asignados")
    db.query(models.Vacante).filter(models.Vacante.id_vacante == id_vacante).delete()
    db.commit()
    return {"status": "ok"}


# --- CRUD ASIGNACIONES (sgi_vacantes_x_alumnos) ---

@app.get("/asignaciones")
def leer_asignaciones(db: Session = Depends(get_db)): #! evita joins complejos
    asigs = db.query(models.VacanteAlumno).all()
    return [{
        "id_vacante_x_alumno": a.id_vacante_x_alumno,
        "id_vacante": a.id_vacante,
        "id_alumno": a.id_alumno,
        "alumno_nombre": f"{a.alumno.nombre} {a.alumno.apellidos}",
        "empresa_nombre": a.vacante.entidad.entidad, #! ciclo_nombre existe solo por enriquecimiento de datos, NO está en la BDD
        "ciclo_nombre": a.vacante.ciclo.ciclo, #? para poder ver en asignaciones el ciclo y curso sin tener que hacer joins adicionales
        "curso": a.vacante.curso
    } for a in asigs]

@app.post("/asignaciones")
def crear_asignacion(asig: schemas.AsignacionCreate, db: Session = Depends(get_db)):
    # 1 verificar si el alumno ya está en cualquier asignación
    # (El unique=True en el modelo ya lo protege, pero esto da un error limpio al frontend)
    existe = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_alumno == asig.id_alumno).first()
    if existe: #! NO SE PUEDEN CREAR DOS ASIGNACIONES POR ALUMNO (REFUERZO DEL UNIQUE)
        raise HTTPException(status_code=400, detail="Este alumno ya está asignado a otra vacante.")
    
    # 2 Verificar cupo de la vacante
    v = db.query(models.Vacante).get(asig.id_vacante)
    if not v: # el frontend ya lo protege, pero esto da un error limpio si se intenta asignar a una vacante que no existe
        raise HTTPException(status_code=404, detail="La vacante no existe.")
        
    num_ocupados = db.query(models.VacanteAlumno).filter(models.VacanteAlumno.id_vacante == asig.id_vacante).count()
    if num_ocupados >= v.num_vacantes: # type: ignore #? eror 400 si se intentase asignar a una vacante ya llena
        raise HTTPException(status_code=400, detail="Lo sentimos, no quedan plazas libres en esta vacante.")
    
    # 3 verificar que el ciclo y curso del alumno coincide con el de la vacante
    alumno = db.query(models.Alumno).get(asig.id_alumno)
    if not alumno:
        raise HTTPException(status_code=404, detail="El alumno no existe.")
    
    if alumno.id_ciclo != v.id_ciclos or alumno.curso != v.curso: # type: ignore # error 400 = bad request
        raise HTTPException(status_code=400, detail="El ciclo o curso del alumno no coincide con los de la vacante.") #! Requisito en asignacion el alumno y la vacante tienen q ser del mismo ciclo y curso
    
    # Crear asignacion
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

@app.get("/entidades-centros") #?para el desplegable de creacion y edicion alumknos
def leer_centros_educativos(db: Session = Depends(get_db)):
    return db.query(models.Entidad).filter(models.Entidad.id_tipo_entidad == 1).all() # muestra solo entidades que son centros educativos (id_tipo_entidad = 1)

@app.get("/asignaciones/vacante/{id_vacante}")
def leer_alumnos_por_vacante(id_vacante: int, db: Session = Depends(get_db)):
    # Hacemos un JOIN entre VacanteAlumno y Alumno para obtener los nombres
    alumnos_asignados = (
        db.query(models.Alumno)
        .join(models.VacanteAlumno, models.Alumno.id_alumno == models.VacanteAlumno.id_alumno)
        .filter(models.VacanteAlumno.id_vacante == id_vacante)
        .all()
    )
    
    return [{
        "id_alumno": a.id_alumno,
        "nombre": a.nombre,
        "apellidos": a.apellidos,
        "nif_nie": a.nif_nie
    } for a in alumnos_asignados]

@app.delete("/asignaciones/vacante/{id_vacante}/alumno/{id_alumno}")
def borrar_asignacion_especifica(id_vacante: int, id_alumno: int, db: Session = Depends(get_db)):
    db.query(models.VacanteAlumno).filter(
        models.VacanteAlumno.id_vacante == id_vacante,
        models.VacanteAlumno.id_alumno == id_alumno
    ).delete()
    db.commit()
    return {"status": "ok"}