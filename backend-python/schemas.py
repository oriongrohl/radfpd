from pydantic import BaseModel
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

class AlumnoCreate(AlumnoBase):
    pass

class Alumno(AlumnoBase):
    id_alumno: int
    id_entidad: int
    centro_nombre: str = ""
    ciclo_nombre: str = ""
    vacante_asignada: str = "Ninguna"
    class Config: from_attributes = True

class VacanteBase(BaseModel):
    id_entidad: int
    id_ciclo: int
    curso: int
    num_vacantes: int
    observaciones: Optional[str] = None

class VacanteCreate(VacanteBase):
    pass

class VacanteUpdate(BaseModel):
    num_vacantes: int

class Vacante(VacanteBase):
    id_vacante: int
    entidad_nombre: str = ""
    ciclo_nombre: str = ""
    num_alumnos: int = 0
    listado_alumnos: List[str] = []
    class Config: from_attributes = True