import { GoogleGenAI } from "@google/genai";
import { FinancialState } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const getFinancialInsights = async (data: FinancialState) => {
  try {
    const ai = getClient();
    const language = data.settings.language || 'en';

    const prompts = {
      en: `
        Analyze the following financial data and provide 3 concise, actionable bullet points of advice or observations. 
        Focus on spending habits, upcoming credit card debts, and budget adherence.
        
        Data:
        ${JSON.stringify({
        totalIncome: data.transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0),
        totalExpenses: data.transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0),
        creditCardDebt: data.creditCards.reduce((acc, c) => acc + (c.totalAmount / c.installmentsTotal) * (c.installmentsTotal - c.installmentsPaid), 0),
        budgets: data.budgets,
        savings: data.assets.reduce((acc, a) => acc + a.value, 0)
      })}
        
        Return the response in raw text format with bullet points.
      `,
      es: `
        Analiza los siguientes datos financieros y proporciona 3 puntos concisos y prácticos de consejos u observaciones.
        Enfócate en hábitos de gasto, deudas de tarjetas de crédito próximas y adherencia al presupuesto.
        
        Datos:
        ${JSON.stringify({
        ingresoTotal: data.transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0),
        gastosTotal: data.transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0),
        deudaTarjeta: data.creditCards.reduce((acc, c) => acc + (c.totalAmount / c.installmentsTotal) * (c.installmentsTotal - c.installmentsPaid), 0),
        presupuestos: data.budgets,
        ahorros: data.assets.reduce((acc, a) => acc + a.value, 0)
      })}
        
        Devuelve la respuesta en formato de texto sin formato con viñetas.
      `
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompts[language],
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    const errorMessages = {
      en: "Unable to generate insights at this time. Please ensure your API key is valid.",
      es: "No se pueden generar recomendaciones en este momento. Por favor verifica que tu API key sea válida."
    };
    return errorMessages[data.settings.language || 'en'];
  }
};

export const predictNextMonthExpenses = async (data: FinancialState) => {
  try {
    const ai = getClient();
    const language = data.settings.language || 'en';

    const prompts = {
      en: `
             Based on the recurring expenses and credit card installments provided, estimate the total guaranteed outflow for next month.
             Also suggest a safe "discretionary spending" limit if the user's average income is around 5000 (or assume based on data if available).
             
             Recurring: ${JSON.stringify(data.recurring)}
             Credit Cards: ${JSON.stringify(data.creditCards)}
             
             Output format: JSON object with keys "estimatedFixedCosts" (number) and "advice" (string).
            `,
      es: `
             Basándote en los gastos recurrentes y cuotas de tarjetas de crédito proporcionados, estima el total de egresos garantizados para el próximo mes.
             También sugiere un límite seguro de "gasto discrecional" si el ingreso promedio del usuario es alrededor de 5000 (o asume según los datos disponibles).
             
             Recurrentes: ${JSON.stringify(data.recurring)}
             Tarjetas de Crédito: ${JSON.stringify(data.creditCards)}
             
             Formato de salida: Objeto JSON con claves "estimatedFixedCosts" (número) y "advice" (texto).
            `
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompts[language],
      config: {
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Prediction Error", error);
    return null;
  }
}