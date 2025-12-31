# Guía: Configurar MongoDB Atlas (GRATIS)

## Qué es MongoDB Atlas?

MongoDB Atlas es la base de datos en la nube de MongoDB, **completamente gratis** hasta 512MB de almacenamiento. Es perfecta para aprendizaje y proyectos pequeños.

## Paso 1: Crear Cuenta en MongoDB Atlas

1. Ve a: **https://www.mongodb.com/cloud/atlas/register**
2. Regístrate con tu email (o usa Google/GitHub)
3. Confirma tu email

## Paso 2: Crear un Cluster Gratuito

1. Después de iniciar sesión, haz clic en **"Build a Database"**
2. Selecciona **"M0 FREE"** (el plan gratuito)
3. Elige un proveedor de nube:
   - **AWS** (recomendado)
   - Región: Elige la más cercana (ej: `eu-west-1` para Europa)
4. Nombre del cluster: deja el nombre por defecto o ponle `Cluster0`
5. Haz clic en **"Create"**
6. Espera 1-3 minutos mientras se crea el cluster

## Paso 3: Configurar Acceso

### 3.1 Crear Usuario de Base de Datos

1. Te aparecerá un modal "Security Quickstart"
2. En **"Authentication Method"**, selecciona **"Username and Password"**
3. Crea un usuario:
   - **Username**: `claudia_user` (o el que prefieras)
   - **Password**: Genera una contraseña segura (GUÁRDALA!)
   - Haz clic en **"Create User"**

### 3.2 Configurar IP de Acceso

1. En **"Where would you like to connect from?"**
2. Selecciona **"My Local Environment"**
3. Haz clic en **"Add My Current IP Address"**
4. **IMPORTANTE para desarrollo**: También agrega `0.0.0.0/0` para permitir acceso desde cualquier IP
   - Haz clic en **"Add IP Address"**
   - IP Address: `0.0.0.0/0`
   - Description: `Allow all (development)`
   - Haz clic en **"Add Entry"**
5. Haz clic en **"Finish and Close"**

## Paso 4: Obtener la Cadena de Conexión

1. En el dashboard, haz clic en **"Connect"** (botón en tu cluster)
2. Selecciona **"Drivers"**
3. Driver: **Node.js**
4. Version: **5.5 or later**
5. Copia la **Connection String** (cadena de conexión)
   - Se verá así: `mongodb+srv://claudia_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

## Paso 5: Configurar tu Aplicación

1. En `C:\App_clau_express`, crea un archivo llamado **`.env`**
2. Abre el archivo `.env` y pega esto:

```
MONGODB_URI=mongodb+srv://claudia_user:TU_PASSWORD_AQUI@cluster0.xxxxx.mongodb.net/claudia?retryWrites=true&w=majority
PORT=3000
```

3. **IMPORTANTE**: Reemplaza:
   - `TU_PASSWORD_AQUI` con la contraseña que creaste en el Paso 3.1
   - `cluster0.xxxxx` con tu cluster real (de la cadena que copiaste)
   - Agrega `/claudia` después de `.net` y antes de `?` (nombre de la base de datos)

### Ejemplo de `.env` completo:

```
MONGODB_URI=mongodb+srv://claudia_user:MiPassword123@cluster0.abc12.mongodb.net/claudia?retryWrites=true&w=majority
PORT=3000
```

## Paso 6: Probar la Conexión

1. Abre una terminal en `C:\App_clau_express`
2. Ejecuta:
```bash
npm run dev
```

3. Deberías ver:
```
 Servidor corriendo en http://localhost:3000
 Conectado a MongoDB
```

4. Abre tu navegador en: **http://localhost:3000**

## Paso 7: Verificar que Funciona

1. En la aplicación, crea un registro de prueba
2. Ve a MongoDB Atlas  **"Browse Collections"**
3. Deberías ver tu base de datos `claudia` con una colección `records`
4. Verás tu registro guardado en la nube! 

## Solución de Problemas

### Error: "Authentication failed"
- Verifica que la contraseña en `.env` sea correcta
- Asegúrate de no tener espacios extra en el `.env`

### Error: "IP not whitelisted"
- Ve a MongoDB Atlas  Network Access
- Agrega `0.0.0.0/0` como IP permitida

### Error: "Cannot connect to MongoDB"
- Verifica que tu cadena de conexión sea correcta
- Asegúrate de tener internet
- Verifica que el cluster esté activo (puede tardar unos minutos en iniciarse)

## Recursos Adicionales

- **MongoDB Atlas Dashboard**: https://cloud.mongodb.com
- **Documentación**: https://docs.atlas.mongodb.com

## Notas Importantes

-  El tier gratuito (M0) es **permanentemente gratis**
-  Tienes **512MB de almacenamiento** (suficiente para miles de registros)
-  Puedes crear hasta **3 clusters gratuitos**
-  **NUNCA** compartas tu archivo `.env` (contiene tu contraseña)
-  El archivo `.env` está en `.gitignore` para proteger tus credenciales

Listo! Ahora tienes una base de datos MongoDB en la nube funcionando gratis. 
