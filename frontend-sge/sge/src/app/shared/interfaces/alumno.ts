export interface AlumnoInterface {
    // id_alumno: String; LA BDD LO DEFINE SOLO NO AQUI!!
    nif_nie: string;
    nombre: string;
    apellidos: string;
    fecha_nacimiento: string; // para psaraselo a pydantic fast api lo vamos a dejar en string
    id_entidad: number;
    id_ciclo: number;
    curso: number;
    telefono: string;
    direccion?: string;
    cp?: string;
    localidad?: string;
    id_provincia: number;
    observaciones?: string;

}
