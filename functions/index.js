// Importa as funções da v2
const {onCall} = require("firebase-functions/v2/https");
const {GoogleGenerativeAI} = require("@google/generative-ai");

// Define e exporta a função usando a sintaxe v2
exports.summarizeText = onCall({secrets: ["GEMINI_KEY"]}, (request) => {
  // Acessa a chave de API das variáveis de ambiente
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

  // Na v2, a autenticação é verificada em 'request.auth'
  if (!request.auth) {
    throw new Error("Você precisa estar autenticado para usar esta função.");
  }

  // O texto enviado pelo cliente fica em 'request.data.text'
  const text = request.data.text;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("O texto fornecido é inválido.");
  }

  // O uso da API do Gemini continua o mesmo
  try {
    const model = genAI.getGenerativeModel({model: "gemini-2.5-flash"});
    const prompt = `Resuma o seguinte texto em português, focando nos pontos
      principais:\n\n"${text}"`;

    // Retorna a promessa para que a função espere a conclusão
    return model.generateContent(prompt).then((result) => {
      const response = result.response;
      const summary = response.text();
      return {summary: summary};
    });
  } catch (error) {
    console.error("Erro na API do Gemini:", error);
    throw new Error("Não foi possível gerar o resumo.");
  }
});
