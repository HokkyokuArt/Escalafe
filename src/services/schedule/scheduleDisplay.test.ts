import { describe, expect, it } from 'vitest';
import { ScheduleDay } from '../../models/Schedule.model';
import { buildDisplayRows } from './scheduleDisplay';

const normalDia = (data: string): ScheduleDay => ({ data, especial: false, atribuicoes: [] });
const especialDia = (data: string, specialWeekId: number, nome: string): ScheduleDay => ({
    data, especial: true, specialWeekId, specialWeekNome: nome, atribuicoes: [],
});

describe('buildDisplayRows', () => {
    it('mantém dias normais como linhas separadas', () => {
        const rows = buildDisplayRows([normalDia('2026-09-01'), normalDia('2026-09-08')]);
        expect(rows).toEqual([
            { tipo: 'normal', dia: normalDia('2026-09-01'), index: 0 },
            { tipo: 'normal', dia: normalDia('2026-09-08'), index: 1 },
        ]);
    });

    it('mescla dias consecutivos da mesma semana especial em uma única linha', () => {
        const rows = buildDisplayRows([
            especialDia('2026-09-13', 1, 'Congresso'),
            especialDia('2026-09-19', 1, 'Congresso'),
            especialDia('2026-09-20', 1, 'Congresso'),
        ]);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toEqual({
            tipo: 'especial',
            specialWeekId: 1,
            dataInicio: '2026-09-13',
            dataFim: '2026-09-20',
            nome: 'Congresso',
        });
    });

    it('não mescla semanas especiais diferentes mesmo que consecutivas', () => {
        const rows = buildDisplayRows([
            especialDia('2026-09-06', 1, 'Congresso'),
            especialDia('2026-09-13', 2, 'Retiro'),
        ]);
        expect(rows).toHaveLength(2);
    });

    it('não mescla semana especial separada por um dia normal', () => {
        const rows = buildDisplayRows([
            especialDia('2026-09-06', 1, 'Congresso'),
            normalDia('2026-09-10'),
            especialDia('2026-09-13', 1, 'Congresso'),
        ]);
        expect(rows).toHaveLength(3);
        expect(rows[0].tipo).toBe('especial');
        expect(rows[1].tipo).toBe('normal');
        expect(rows[2].tipo).toBe('especial');
    });

    it('preserva o índice original para acessar atribuições dos dias normais', () => {
        const rows = buildDisplayRows([
            especialDia('2026-09-06', 1, 'Congresso'),
            normalDia('2026-09-13'),
        ]);
        const normal = rows.find(r => r.tipo === 'normal');
        expect(normal && normal.tipo === 'normal' && normal.index).toBe(1);
    });
});
