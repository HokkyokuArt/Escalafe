import { describe, expect, it } from 'vitest';
import { Status } from '../../enum/Status';
import { Funcao } from '../../models/Funcao.model';
import { getDefaultPdfConfig } from '../../hooks/useLocalStorage';
import { Pessoa } from '../../models/Pessoa.model';
import { Schedule, ScheduleStatus } from '../../models/Schedule.model';
import { generateSchedulePdfBlob } from './ScheduleDocument';

const leitor: Funcao = { id: 1, nome: 'Leitor', status: Status.ATIVO, posicoes: [] };
const pessoas: Pessoa[] = [{ id: 1, nome: 'João', status: Status.ATIVO, funcoes: [leitor] }];

const schedule: Schedule = {
    id: 1,
    nome: 'Escala de Teste',
    dataInicio: '2026-09-01',
    dataFim: '2026-09-08',
    funcoesIds: [leitor.id],
    dias: [
        { data: '2026-09-01', especial: false, atribuicoes: [{ funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true }] },
        { data: '2026-09-08', especial: true, specialWeekId: 1, specialWeekNome: 'Congresso', atribuicoes: [] },
    ],
    scheduleConfig: { diasSemana: [0, 1, 2, 3, 4, 5, 6] },
    status: ScheduleStatus.FINALIZADA,
    criadoEm: '2026-08-01T00:00:00.000Z',
    atualizadoEm: '2026-08-01T00:00:00.000Z',
};

describe('generateSchedulePdfBlob', () => {
    it('gera um PDF válido sem lançar exceção', async () => {
        const blob = await generateSchedulePdfBlob(schedule, pessoas, [leitor], getDefaultPdfConfig());
        expect(blob.size).toBeGreaterThan(0);
        expect(blob.type).toBe('application/pdf');
    });
});
