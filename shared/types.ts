export interface IFactory {
    id?: string;
    factoryName: string;
    country: string;
    address: string;
    latitude: number;
    longitude: number;
    yearlyRevenue: number;
    temperatureRisk?: "Low" | "High" | "Undefined";
}

export interface IFactoriesPage {
    factories: IFactory[];
    hasMore: boolean;
}