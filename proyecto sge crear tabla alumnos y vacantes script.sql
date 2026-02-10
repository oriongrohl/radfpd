use app_radfpd;
SELECT * FROM sgi_entidades;
SELECT * FROM sgi_tipos_entidad;

# sgi_tipos_entidad sgi_entidades sgi_ciclos sgi_provincias
DROP TABLE IF EXISTS sgi_alumno;
-- Estructura de tabla para la tabla `sgi_alumno`
--
CREATE TABLE `sgi_alumno` (
  `id_alumno` int(11) NOT NULL AUTO_INCREMENT,
  `nif_nie` char(9) NOT NULL UNIQUE KEY,
  `nombre` varchar(50) NOT NULL,
  `apellidos` varchar(50) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `id_entidad` int(11) NOT NULL,
  `id_ciclo` int(11) NOT NULL,
  `curso` int(11) NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `direccion` varchar(50) DEFAULT NULL,
  `cp` varchar(10) DEFAULT NULL,
  `localidad` varchar(50) DEFAULT NULL,
  `observaciones` text,
  `id_provincia` int(11) NOT NULL,
  PRIMARY KEY (`id_alumno`), 
  CONSTRAINT `fk_alumnos_entidad` FOREIGN KEY (`id_entidad`) REFERENCES `sgi_entidades` (`id_entidad`) ON UPDATE CASCADE,
  CONSTRAINT `fk_alumnos_ciclo` FOREIGN KEY (`id_ciclo`) REFERENCES `sgi_ciclos` (`id_ciclo`) ON UPDATE CASCADE,
  CONSTRAINT `fk_alumnos_provincia` FOREIGN KEY (`id_provincia`) REFERENCES `sgi_provincias` (`id_provincia`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO sgi_alumno (nif_nie, nombre, apellidos, fecha_nacimiento, id_entidad, id_ciclo, curso, telefono, id_provincia) 
VALUES ('12345678Z', 'Ana', 'García', '2004-05-20', 1, 1, 1, '600112233', 78);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `sgi_vacantes`
--
DROP TABLE if exists `sgi_vacantes`;
CREATE TABLE `sgi_vacantes` (
  `id_vacante` int(11) NOT NULL AUTO_INCREMENT,
  `id_entidad` int(11) NOT NULL,
  `id_ciclos` int(11) NOT NULL,
  `curso` int(11) NOT NULL,
  `num_plazas` int(11) DEFAULT 1, -- para saber cuántas plazas hay
  PRIMARY KEY (`id_vacante`),
  CONSTRAINT `fk_vacantes_entidad` FOREIGN KEY (`id_entidad`) REFERENCES `sgi_entidades` (`id_entidad`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_vacantes_ciclos` FOREIGN KEY (`id_ciclos`) REFERENCES `sgi_ciclos` (`id_ciclo`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;