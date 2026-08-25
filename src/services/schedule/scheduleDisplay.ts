import { ScheduleDay } from "../../models/Schedule.model";

export type DisplayRow =
    | { tipo: 'normal'; dia: ScheduleDay; index: number; }
    | { tipo: 'especial'; specialWeekId?: number; dataInicio: string; dataFim: string; nome?: string; };

export const buildDisplayRows = (dias: ScheduleDay[]): DisplayRow[] => {
    const rows: DisplayRow[] = [];

    dias.forEach((dia, index) => {
        if (!dia.especial) {
            rows.push({ tipo: 'normal', dia, index });
            return;
        }

        const ultima = rows[rows.length - 1];
        if (ultima?.tipo === 'especial' && ultima.specialWeekId === dia.specialWeekId) {
            ultima.dataFim = dia.data;
            return;
        }

        rows.push({
            tipo: 'especial',
            specialWeekId: dia.specialWeekId,
            dataInicio: dia.data,
            dataFim: dia.data,
            nome: dia.specialWeekNome,
        });
    });

    return rows;
};
