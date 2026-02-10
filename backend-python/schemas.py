from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class AlumnoBase(BaseModel):
    nif_nie: str
    nombre: str
    apellidos: str
    fecha_nacimiento: date
    id_entidad: int
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
    centro_nombre: str = "" # <- Para el grid
    ciclo_nombre: str = ""  # <- Para el grid
    vacante_asignada: str = "Ninguna" # <- Para el grid

    class Config:
        from_attributes = True

class VacanteBase(BaseModel):
    id_entidad: int
    id_ciclo: int
    curso: int
    num_plazas: int
    observaciones: Optional[str] = None

class VacanteCreate(VacanteBase):
    pass

class Vacante(VacanteBase):
    id_vacante: int
    entidad_nombre: str = ""
    ciclo_nombre: str = ""
    num_alumnos: int = 0
    listado_alumnos: List[str] = [] # Para la tabla auxiliar

    class Config:
        from_attributes = True