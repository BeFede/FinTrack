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
    
    const prompt = `
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
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate insights at this time. Please ensure your API key is valid.";
  }
};

export const predictNextMonthExpenses = async (data: FinancialState) => {
    try {
        const ai = getClient();
        const prompt = `
         Based on the recurring expenses and credit card installments provided, estimate the total guaranteed outflow for next month.
         Also suggest a safe "discretionary spending" limit if the user's average income is around 5000 (or assume based on data if available).
         
         Recurring: ${JSON.stringify(data.recurring)}
         Credit Cards: ${JSON.stringify(data.creditCards)}
         
         Output format: JSON object with keys "estimatedFixedCosts" (number) and "advice" (string).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
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