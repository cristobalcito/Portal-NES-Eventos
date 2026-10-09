
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function modificarUsuarioBackend(req, res) {
  try {
    const { id } = req.params;
    const { nombre, email, rut, rol } = req.body;

    if (!id) {
      return res.status(400).json({ 
        error: 'El ID del usuario es requerido' 
      });
    }

    // 1. Verificar si el usuario existe junto con sus relaciones
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: Number(id) || id },
      include: {
        gerenteGeneral: true,
        personalOperaciones: true,
        cliente: true,
        personalEventual: true,
      },
    });

    if (!usuarioExistente) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    // 2. Si se actualiza el email o RUT, verificar que no estén duplicados en otro usuario
    if (email && email !== usuarioExistente.email) {
      const emailExiste = await prisma.usuario.findFirst({
        where: { email, NOT: { id: usuarioExistente.id } },
      });
      if (emailExiste) {
        return res.status(400).json({ 
          error: 'El correo electrónico ya está registrado por otro usuario' 
        });
      }
    }

    if (rut && rut !== usuarioExistente.rut) {
      const rutExiste = await prisma.usuario.findFirst({
        where: { rut, NOT: { id: usuarioExistente.id } },
      });
      if (rutExiste) {
        return res.status(400).json({ 
          error: 'El RUT ya está registrado por otro usuario' 
        });
      }
    }

    // 3. Actualizar el registro principal en la base de datos
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: usuarioExistente.id },
      data: {
        ...(nombre && { nombre }),
        ...(email && { email }),
        ...(rut && { rut }),
      },
      include: {
        gerenteGeneral: true,
        personalOperaciones: true,
        cliente: true,
        personalEventual: true,
      },
    });

    // 4. Determinar ROL preservando la jerarquía o el rol enviado en el body
    let rolCalculado = rol;
    if (!rolCalculado) {
      if (usuarioActualizado.gerenteGeneral || usuarioActualizado.email === 'gerente@nes-eventos.cl') {
        rolCalculado = 'GERENTE_GENERAL';
      } else if (usuarioActualizado.personalOperaciones) {
        rolCalculado = 'PERSONAL_OPERACIONES';
      } else if (usuarioActualizado.cliente) {
        rolCalculado = 'CLIENTE';
      } else if (usuarioActualizado.personalEventual) {
        rolCalculado = 'PERSONAL_EVENTUAL';
      } else {
        rolCalculado = 'SIN_ROL';
      }
    }

    // 5. Determinar el RUT real final
    const rutReal = 
      usuarioActualizado.rut || 
      usuarioActualizado.Rut || 
      usuarioActualizado.RUT || 
      usuarioActualizado.gerenteGeneral?.rut ||
      usuarioActualizado.personalOperaciones?.rut ||
      usuarioActualizado.cliente?.rut ||
      usuarioActualizado.personalEventual?.rut ||
      rut || 
      'Sin RUT registrado';

    // 6. Retornar payload normalizado idéntico al del Login
    return res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: {
        id: usuarioActualizado.id,
        rut: rutReal,
        nombre: usuarioActualizado.nombre || usuarioActualizado.Nombre || 'Usuario',
        email: usuarioActualizado.email,
        rol: rolCalculado
      }
    });

  } catch (error) {
    console.error('Error en modificarUsuarioBackend:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor al modificar el usuario' 
    });
  }
}