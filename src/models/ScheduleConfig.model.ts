export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const diasSemanaLabel: Record<DiaSemana, string> = {
    0: 'Domingo',
    1: 'Segunda',
    2: 'Terça',
    3: 'Quarta',
    4: 'Quinta',
    5: 'Sexta',
    6: 'Sábado',
};

export type ScheduleConfig = {
    diasSemana: DiaSemana[];
    ultimaOrdemFuncoes: number[];
};
