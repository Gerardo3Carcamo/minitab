# Manual Operativo Para Usuario - Minitab App

Este manual esta orientado a usuario final.  
Objetivo: que sepas **que hacer, como hacerlo y que funciones puedes usar** dentro de la app.

---

## 1. Antes de empezar

La app funciona con:
- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:8000/api/v1`

Si la pantalla no carga datos o marca error de conexion, pide soporte tecnico para validar que backend y frontend esten activos.

---

## 2. Flujo operativo recomendado (paso a paso)

### Paso 1: Cargar datos

1. En el menu lateral entra a **Carga de Datos**.
2. Selecciona un archivo (`.xlsx`, `.xls`, `.csv`, `.txt`).
3. Si es Excel, elige hoja.
4. Opcional: define rango de filas y delimitador.
5. Haz clic en **Subir y previsualizar**.
6. Revisa la vista previa.
7. Haz clic en **Importar al workspace**.

Resultado esperado: dataset activo para todo el analisis.

### Paso 2: Revisar y preparar en Workspace

1. Entra a **Workspace**.
2. Revisa filas, columnas y valores nulos.
3. Usa filtros, busqueda y ordenamiento.
4. Si hace falta, renombra columnas o corrige celdas.

Resultado esperado: datos limpios y entendibles antes de analizar.

### Paso 3: Limpieza de datos

1. Entra a **Limpieza**.
2. Ejecuta acciones de faltantes (drop/imputar).
3. Detecta outliers.
4. Aplica transformaciones (`log`, `sqrt`, `boxcox`) si procede.
5. Valida en Workspace que el dataset quedo correcto.

Resultado esperado: dataset listo para analisis estadistico.

### Paso 4: Analisis descriptivo y visual

1. Entra a **Descriptiva** para media, mediana, varianza, percentiles, etc.
2. Entra a **Visualizacion** para histogramas, boxplots, scatter, linea, pareto y heatmap.
3. Ajusta columnas/ejes y ejecuta.

Resultado esperado: entendimiento inicial de distribuciones, tendencias y relaciones.

### Paso 5: Analisis avanzado

Usa segun necesidad:
- **Inferencia**: pruebas t, ANOVA, chi-cuadrada, no parametricas.
- **Regresion**: lineal, multiple, logistica, polinomial, correlacion.
- **DOE**: factorial, fraccional, superficie de respuesta, efectos.
- **SPC**: cartas de control y capacidad de proceso.
- **Calidad**: pareto, agrupacion de defectos, causa raiz.
- **Series de tiempo**: descomposicion, forecast, ARIMA.
- **Multivariada**: PCA, clustering, discriminante.
- **Automatizacion**: guardar configuraciones y revisar ejecuciones.

### Paso 6: Reporte y salida

1. Entra a **Reportes**.
2. Elige formato (`PDF` o `Excel`).
3. Activa secciones a incluir.
4. Exporta y guarda el artefacto generado.

---

## 3. Que puede hacer cada modulo (resumen funcional)

### Dashboard
- Te da accesos rapidos a todo el flujo.
- Te recuerda la secuencia sugerida de trabajo.

### Carga de Datos
- Carga archivos Excel/CSV/TXT.
- Previsualiza datos antes de importar.
- Maneja historial de cargas.

### Workspace
- Vista tabular.
- Edicion basica de celdas.
- Filtros, ordenamiento y busqueda.
- Inspeccion de columnas y nulos.

### Limpieza
- Manejo de valores faltantes.
- Deteccion de outliers.
- Transformaciones de variables.
- Normalizacion de nombres de columnas.

### Descriptiva
- Estadisticas por columna.
- Percentiles y frecuencias.
- Resumen general del dataset.

### Visualizacion
- Histogramas, boxplot, scatter, linea, pareto, heatmap.
- Configuracion de ejes y export de grafica en JSON.

### Inferencia
- Intervalos de confianza.
- Prueba t (1 muestra y 2 muestras).
- ANOVA.
- Chi-cuadrada.
- No parametricas.

### Regresion
- Regresion lineal simple y multiple.
- Regresion logistica.
- Modelo polinomial.
- Correlacion.

### DOE
- Diseno factorial y fraccional.
- Superficie de respuesta.
- Analisis de efectos.

### SPC
- Carta X-barra/R.
- Cartas p, np, c, u.
- Capacidad de proceso.

### Calidad
- Pareto.
- Agrupacion de defectos.
- Estructura de causa raiz.

### Series de Tiempo
- Descomposicion.
- Suavizamiento exponencial.
- Pronostico.
- ARIMA.

### Multivariada
- PCA.
- Clustering.
- Discriminante.

### Automatizacion
- Guardar configuraciones de analisis.
- Registrar y consultar ejecuciones.

### Reportes
- Exportacion de reporte en PDF/XLSX.
- Seleccion de secciones incluidas.

---

## 4. Como usar los modulos con formulario JSON

Los modulos avanzados (Inferencia, Regresion, DOE, SPC, Calidad, Series, Multivariada, Automatizacion) usan:
- selector de tipo de analisis
- caja de **Parametros (JSON)**
- boton **Ejecutar**

### Regla operativa principal

Incluye siempre `dataset_id` cuando:
- no estas seguro de que hay dataset activo, o
- vienes de una sesion nueva.

### Plantillas base utiles

#### Inferencia - Prueba t (1 muestra)
```json
{
  "dataset_id": "<dataset_id>",
  "column": "temperature",
  "population_mean": 0,
  "alpha": 0.05
}
```

#### Inferencia - Intervalo de confianza
```json
{
  "dataset_id": "<dataset_id>",
  "column": "temperature",
  "alpha": 0.05
}
```

#### Regresion lineal/multiple
```json
{
  "dataset_id": "<dataset_id>",
  "target": "defects",
  "features": ["temperature", "pressure"]
}
```

#### SPC - Capacidad
```json
{
  "dataset_id": "<dataset_id>",
  "column": "diameter",
  "lsl": 9.5,
  "usl": 10.5
}
```

#### Series de tiempo - Forecast
```json
{
  "dataset_id": "<dataset_id>",
  "date_column": "date",
  "value_column": "sales",
  "frequency": "D",
  "periods": 12
}
```

#### Multivariada - PCA
```json
{
  "dataset_id": "<dataset_id>",
  "columns": ["temperature", "pressure", "humidity"],
  "n_components": 2
}
```

---

## 5. Procedimientos operativos tipicos

### Escenario A: Analizar variacion de proceso

1. Carga dataset.
2. Limpia nulos y outliers.
3. Corre Descriptiva.
4. Genera Histograma y Boxplot.
5. Ejecuta Prueba t o ANOVA.
6. Si aplica calidad, corre SPC capacidad.
7. Exporta reporte.

### Escenario B: Validar relacion entre variables

1. Carga dataset.
2. Workspace: valida tipos de columnas.
3. Visualizacion: scatter.
4. Regresion: correlacion y lineal.
5. Exporta reporte.

### Escenario C: Preparar entrega ejecutiva

1. Ejecuta analisis principales.
2. Verifica resultados y mensajes de interpretacion.
3. En Reportes activa solo secciones relevantes.
4. Exporta PDF para negocio y XLSX para analista.

---

## 6. Errores frecuentes y que hacer

### Error: `missing dataset_id`
- Significa que no se envio el id del dataset.
- Accion: agrega `dataset_id` en JSON o importa dataset de nuevo.

### Error: `missing column` o `missing population_mean`
- Suele pasar en Prueba t de una muestra.
- Accion: agrega ambos campos en JSON.

### Error: "No fue posible conectar con el backend"
- Accion: confirma que backend este encendido.
- Si sigue igual, reporta a soporte.

### Error: "Validation error"
- Accion: revisa nombres de llaves JSON y tipos de dato.
- Recomendacion: usar plantillas de este manual y ajustar valores.

---

## 7. Checklist operativo diario

Antes de ejecutar analisis:
- [ ] Dataset importado correctamente.
- [ ] Columnas clave revisadas en Workspace.
- [ ] Valores faltantes tratados.
- [ ] Tipo de analisis seleccionado correctamente.
- [ ] JSON validado (si aplica).

Antes de cerrar sesion:
- [ ] Resultados relevantes exportados.
- [ ] Reporte PDF/XLSX generado.
- [ ] Evidencia guardada con fecha y dataset.

---

## 8. Soporte rapido

Si algo no cuadra:
1. Repite el flujo desde Carga de Datos.
2. Verifica `dataset_id` y campos requeridos.
3. Si persiste, comparte captura + JSON usado + mensaje de error completo a soporte tecnico.
