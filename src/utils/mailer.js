const { Resend } = require('resend');

/**
 * Inicializa Resend con la API Key del .env
 * Si no hay API Key (entorno local), se usa un dummy o log
 */
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

/**
 * Código OTP de verificación de correo
 */
const sendVerificationCode = async (toEmail, code, name) => {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM,
            to: toEmail,
            subject: 'Tu código de verificación — Estadías UT Tecamachalco',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px;">
                <div style="background: linear-gradient(135deg, #009B4D 0%, #FF7900 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h2 style="color: white; margin: 0;">UT Tecamachalco</h2>
                    <p style="color: rgba(255,255,255,0.85); margin: 5px 0 : 0;">Sistema de Estadías Profesionales</p>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                    <p style="font-size: 16px; color: #374151;">Hola, <strong>${name}</strong></p>
                    <p style="color: #6b7280;">Usa el siguiente código para verificar tu correo electrónico:</p>
                    <div style="background: white; border: 2px dashed #009B4D; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #111827;">${code}</span>
                    </div>
                    <p style="color: #9ca3af; font-size: 13px;">Este código expira en <strong>10 minutos</strong>.</p>
                    <p style="color: #9ca3af; font-size: 13px;">Si no solicitaste esto, ignora este mensaje.</p>
                </div>
            </div>`
        });

        if (error) {
            // Modo prueba: Si falla (por falta de dominio verificado), mostramos en consola
            console.log("\n⚠️ [RESEND SANDBOX] No se pudo enviar el correo real.");
            console.log(`📧 Para: ${toEmail} | 🔑 Código: ${code}\n`);
            return { message: 'Modo prueba: código mostrado en consola' };
        }
        return data;
    } catch (err) {
        console.log("\n⚠️ [MODE PRUEBA] Error conexión Resend.");
        console.log(`📧 Para: ${toEmail} | 🔑 Código: ${code}\n`);
        return { message: 'Modo prueba: código mostrado en consola' };
    }
};

/**
 * Notificación al alumno cuando el admin aprueba o rechaza un documento
 */
const sendReviewNotification = async (toEmail, studentName, documentName, status, reviewNote) => {
    try {
        const isApproved = status === 'Aprobado';
        const color = isApproved ? '#059669' : '#DC2626';
        const bg = isApproved ? '#D1FAE5' : '#FEE2E2';
        const emoji = isApproved ? '✅' : '❌';

        const { data, error } = await resend.emails.send({
            from: FROM,
            to: toEmail,
            subject: `${emoji} Documento ${status}: ${documentName} — Estadías UT`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px;">
                <div style="background: linear-gradient(135deg, #009B4D 0%, #FF7900 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h2 style="color: white; margin: 0;">UT Tecamachalco — Estadías</h2>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                    <p style="font-size: 16px; color: #374151;">Hola, <strong>${studentName}</strong></p>
                    <p style="color: #374151;">Tu documento ha sido revisado:</p>
                    <div style="background: ${bg}; border-left: 4px solid ${color}; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="margin: 0; font-weight: 600; color: ${color}; font-size: 1.1rem;">${emoji} ${documentName}</p>
                        <p style="margin: 4px 0 0; color: ${color};">Estado: <strong>${status}</strong></p>
                    </div>
                    ${reviewNote ? `
                    <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="margin: 0; font-weight: 600; color: #92400E;">Comentario del revisor:</p>
                        <p style="margin: 6px 0 0; color: #78350F;">${reviewNote}</p>
                    </div>
                    ` : ''}
                    <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
                        Ingresa al sistema para ${isApproved ? 'continuar con el proceso' : 'corregir y volver a subir el documento'}.
                    </p>
                </div>
            </div>`
        });

        if (error) {
            console.error('❌ Error Resend notification:', error);
            throw error;
        }
        return data;
    } catch (err) {
        console.error('❌ Error sending review notification:', err);
        throw err;
    }
};

module.exports = { sendVerificationCode, sendReviewNotification };
