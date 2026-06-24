export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
  }

  const { name, email, city, bid } = body;

  if (!name || !email || !city || !bid) {
  return new Response(
    JSON.stringify({ error: 'Campos obrigatórios faltando' }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Domain Bid <onboarding@resend.dev>',
        to: env.OWNER_EMAIL,
        subject: `Nova proposta: ${bid}`,
        html: `
          <h2>Nova proposta recebida</h2>
          <p><strong>Nome/Empresa:</strong> ${name}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          <p><strong>Cidade:</strong> ${city || '-'}</p>
          <p><strong>Proposta:</strong> ${bid}</p>
        `,
      }),
    });

    if (!resendRes.ok) {
      throw new Error('Falha ao enviar email');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro ao processar sua proposta' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}