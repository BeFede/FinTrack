import { Currency } from '../types';

const API_URL = 'https://open.er-api.com/v6/latest/USD';

export const fetchExchangeRates = async (): Promise<Record<Currency, number> | null> => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data && data.rates) {
            // Map the API rates to our Currency type
            // Note: The API returns many currencies, we only care about ours
            const rates: Record<Currency, number> = {
                USD: 1,
                EUR: data.rates.EUR || 0.92,
                ARS: data.rates.ARS || 1000,
            };
            return rates;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        return null;
    }
};
