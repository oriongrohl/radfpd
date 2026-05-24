from pydantic import BaseModel # libreria pydantic
from datetime import date
from typing import List, Optional

class Ciclo(BaseModel):
    id_ciclo: int
    ciclo: str
    cod_ciclo: str
    id_nivel: int
    id_familia: int
    observaciones: Optional[str] = None
    class Config: from_attributes = True

# --- ALUMNOS ---
class AlumnoBase(BaseModel):
    nif_nie: str
    nombre: str
    apellidos: str
    fecha_nacimiento: date
    id_ciclo: int
    curso: int
    telefono: str
    direccion: Optional[str] = None
    cp: Optional[str] = None
    localidad: Optional[str] = None
    id_provincia: int
    observaciones: Optional[str] = None

class AlumnoCreate(AlumnoBase): # POST 
    nif_nie: str
    nombre: str
    apellidos: str
    id_ciclo: int
    id_entidad: int
    curso: int
    fecha_nacimiento: date
    # no se incluye el id_alumno pq al mandar el POST no existe
    # no id_entidad porque el backend siempre pondrá 1
    pass

class Alumno(AlumnoBase): # lo que devuelve a angular
    id_alumno: int
    id_entidad: int
    centro_nombre: str = ""
    ciclo_nombre: str = ""
    vacante_asignada: str = "Ninguna"
    class Config: from_attributes = True

# --- VACANTES ---
class VacanteBase(BaseModel):
    id_entidad: int
    id_ciclos: int 
    curso: int
    num_vacantes: int
    observaciones: Optional[str] = None

class VacanteCreate(VacanteBase):
    pass

class VacanteUpdate(BaseModel):
    num_vacantes: int

class Vacante(VacanteBase): # lo que envia el backend al frontend
    id_vacante: int
    entidad_nombre: str = ""
    ciclo_nombre: str = ""
    num_alumnos: int = 0
    listado_alumnos: List[str] = []
    class Config: from_attributes = True

# --- ASIGNACIONES (Tabla Intermedia) ---
class VacanteAlumnoBase(BaseModel):
    id_vacante: int
    id_alumno: int

class VacanteAlumnoCreate(VacanteAlumnoBase):
    pass

class VacanteAlumno(VacanteAlumnoBase):
    id_vacante_x_alumno: int
    alumno_nombre: str = ""
    empresa_nombre: str = ""
    class Config: from_attributes = True

class AsignacionCreate(BaseModel):
    id_vacante: int
    id_alumno: int


# --- USUARIOS ---
class UsuarioBase(BaseModel):
    usuario: str
    nombre_publico: Optional[str] = None
    habilitado: int = 1
    rol: str = 'user'

class UsuarioCreate(UsuarioBase):
    pass_user: str

class UsuarioUpdate(BaseModel):
    nombre_publico: Optional[str] = None
    habilitado: int
    rol: str

class Usuario(UsuarioBase):
    id_usuario: int
    class Config: from_attributes = True


# --- FAVORITAS ---
class FavoritaCreate(BaseModel):
    id_movie: int

class Favorita(BaseModel):
    id: int
    id_usuario: int
    id_movie: int
    class Config: from_attributes = True