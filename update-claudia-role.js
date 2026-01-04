// Script para cambiar el rol del usuario "claudia" a "user"
const mongoose = require('mongoose');
const User = require('./User');

async function updateClaudiaRole() {
    try {
        // Conectar a MongoDB
        await mongoose.connect('mongodb://localhost:27017/claudia');
        console.log('✅ Conectado a MongoDB');

        // Buscar usuario claudia
        const claudia = await User.findOne({ username: 'claudia' });

        if (!claudia) {
            console.log('❌ Usuario "claudia" no encontrado');
            process.exit(1);
        }

        console.log(`📋 Usuario encontrado: ${claudia.username}`);
        console.log(`📋 Rol actual: ${claudia.role}`);

        // Cambiar rol a user
        claudia.role = 'user';
        await claudia.save();

        console.log('✅ Rol actualizado a: user');
        console.log('✅ Cambio completado exitosamente');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateClaudiaRole();
