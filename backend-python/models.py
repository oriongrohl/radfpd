from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

# --- MAESTROS ---
class Provincia(Base):
    __tablename__ = "sgi_provincias"
    id_provincia = Column(Integer, primary_key=True, autoincrement=True)
    provincia = Column(String(50))

class Ciclo(Base):
    __tablename__ = "sgi_ciclos"
    id_ciclo = Column(Integer, primary_key=True, autoincrement=True)
    ciclo = Column(String(150))

class Entidad(Base):
    __tablename__ = "sgi_entidades"
    id_entidad = Column(Integer, primary_key=True, autoincrement=True)
    entidad = Column(String(50), nullable=False) # Nombre del centro o empresa

# --- ALUMNO ---
class Alumno(Base):
    __tablename__ = "sgi_alumno"
    id_alumno = Column(Integer, primary_key=True, autoincrement=True)
    nif_nie = Column(String(9), unique=True, nullable=False)
    nombre = Column(String(50), nullable=False)
    apellidos = Column(String(50), nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    id_entidad = Column(Integer, ForeignKey("sgi_entidades.id_entidad"), nullable=False)
    id_ciclo = Column(Integer, ForeignKey("sgi_ciclos.id_ciclo"), nullable=False)
    curso = Column(Integer, nullable=False)
    telefono = Column(String(15), nullable=False)
    direccion = Column(String(50))
    cp = Column(String(10))
    localidad = Column(String(50))
    id_provincia = Column(Integer, ForeignKey("sgi_provincias.id_provincia"), nullable=False)
    observaciones = Column(Text)

    entidad = relationship("Entidad")
    ciclo = relationship("Ciclo")
    # Relación para sacar la vacante asignada en el grid # <-
    asignacion = relationship("Vacante", secondary="sgi_vacantes_x_alumnos", back_populates="alumnos", viewonly=True)

# --- VACANTE ---
class Vacante(Base):
    __tablename__ = "sgi_vacantes"
    id_vacante = Column(Integer, primary_key=True, autoincrement=True)
    id_entidad = Column(Integer, ForeignKey("sgi_entidades.id_entidad"), nullable=False)
    id_ciclos = Column(Integer, ForeignKey("sgi_ciclos.id_ciclo"), nullable=False) # <- Corregido a id_ciclo
    curso = Column(Integer, nullable=False)
    num_plazas = Column(Integer, default=1)
    num_vacantes = Column(Integer, default=0)
    observaciones = Column(Text)

    __table_args__ = (UniqueConstraint('id_entidad', 'id_ciclos', 'curso', name='_entidad_ciclo_curso_uc'),)

    entidad = relationship("Entidad")
    ciclo = relationship("Ciclo")
    alumnos = relationship("Alumno", secondary="sgi_vacantes_x_alumnos", back_populates="asignacion")

# --- INTERMEDIA ---
class VacanteAlumno(Base):
    __tablename__ = "sgi_vacantes_x_alumnos"
    id_vacante_x_alumno = Column(Integer, primary_key=True, autoincrement=True)
    id_vacante = Column(Integer, ForeignKey("sgi_vacantes.id_vacante"), nullable=False)
    id_alumno = Column(Integer, ForeignKey("sgi_alumno.id_alumno"), nullable=False, unique=True)

