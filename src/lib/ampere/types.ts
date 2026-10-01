export type Appliance = {
    id: string;
    name: string;
    runningAmpsTenths: number;
    startupAmpsTenths: number | null;
    enabled: boolean;
    starting: boolean;
    note: string;
    origin: 'catalog' | 'user';
};

export type ApplianceInput = {
    name: string;
    runningAmpsTenths: number;
    startupAmpsTenths: number | null;
    note: string;
};

export type AmpereSummary = {
    totalTenths: number;
    limitTenths: number;
    remainingTenths: number;
    status: 'within' | 'reached' | 'exceeded';
};

export type ChartGroup = {
    id: string;
    name: string;
    ampsTenths: number;
    applianceCount: number;
};
