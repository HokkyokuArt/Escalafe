import { describe, expect, it } from 'vitest';
import { Status } from '../../enum/Status';
import { Funcao } from '../../models/Funcao.model';
import { Pessoa } from '../../models/Pessoa.model';
import { Schedule, ScheduleDay, ScheduleStatus } from '../../models/Schedule.model';
import { validateSchedule } from './validateSchedule';

const leitor: Funcao = { id: 1, nome: 'Leitor', status: Status.ATIVO, posicoes: [] };
const microfone: Funcao = { id: 2, nome: 'Microfone', status: Status.ATIVO, posicoes: [] };
const indicador: Funcao = {
    id: 3, nome: 'Indicador', status: Status.ATIVO,
    posicoes: [{ id: 1, nome: 'Entrada' }, { id: 2, nome: 'Corredor' }],
};
const funcoes = [leitor, microfone, indicador];

const pessoa = (id: number, nome: string, status: Status, funcs: Funcao[]): Pessoa => ({
    id, nome, status, funcoes: funcs,
});

const baseSchedule = (dias: ScheduleDay[]): Schedule => ({
    id: 1,
    nome: 'Teste',
    dataInicio: dias[0]?.data ?? '2026-09-01',
    dataFim: dias[dias.length - 1]?.data ?? '2026-09-01',
    funcoesIds: [leitor.id, microfone.id, indicador.id],
    dias,
    scheduleConfig: { diasSemana: [0, 1, 2, 3, 4, 5, 6] },
    status: ScheduleStatus.RASCUNHO,
    criadoEm: '2026-08-01T00:00:00.000Z',
    atualizadoEm: '2026-08-01T00:00:00.000Z',
});

describe('validateSchedule', () => {
    it('acusa pessoa inativa atribuída automaticamente', () => {
        const pessoas = [pessoa(1, 'Inativo', Status.INATIVO, [leitor])];
        const dias: ScheduleDay[] = [{ data: '2026-09-01', especial: false, atribuicoes: [{ funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: false }] }];
        const result = validateSchedule(baseSchedule(dias), pessoas, funcoes);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'PESSOA_INATIVA')).toBe(true);
    });

    it('permite pessoa inativa quando atribuição foi manual', () => {
        const pessoas = [pessoa(1, 'Inativo', Status.INATIVO, [leitor])];
        const dias: ScheduleDay[] = [{ data: '2026-09-01', especial: false, atribuicoes: [{ funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true }] }];
        const result = validateSchedule(baseSchedule(dias), pessoas, funcoes);
        expect(result.errors.some(e => e.code === 'PESSOA_INATIVA')).toBe(false);
    });

    it('acusa pessoa sem a função atribuída', () => {
        const pessoas = [pessoa(1, 'SemFuncao', Status.ATIVO, [microfone])];
        const dias: ScheduleDay[] = [{ data: '2026-09-01', especial: false, atribuicoes: [{ funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true }] }];
        const result = validateSchedule(baseSchedule(dias), pessoas, funcoes);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'FUNCAO_INCOMPATIVEL')).toBe(true);
    });

    it('acusa conflito de duas funções no mesmo dia para a mesma pessoa', () => {
        const pessoas = [pessoa(1, 'Dupla', Status.ATIVO, [leitor, microfone])];
        const dias: ScheduleDay[] = [{
            data: '2026-09-01',
            especial: false,
            atribuicoes: [
                { funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true },
                { funcaoId: microfone.id, posicaoId: null, pessoaId: 1, manual: true },
            ],
        }];
        const result = validateSchedule(baseSchedule(dias), pessoas, funcoes);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'CONFLITO_DIARIO')).toBe(true);
    });

    it('acusa mais de 3 dias consecutivos', () => {
        const pessoas = [pessoa(1, 'A', Status.ATIVO, [leitor])];
        const dias: ScheduleDay[] = ['01', '02', '03', '04'].map(d => ({
            data: `2026-09-${d}`,
            especial: false,
            atribuicoes: [{ funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true }],
        }));
        const result = validateSchedule(baseSchedule(dias), pessoas, funcoes);
        expect(result.warnings.some(w => w.code === 'DIAS_CONSECUTIVOS')).toBe(true);
    });

    it('acusa mais de 3 dias elegíveis sem participação', () => {
        const pessoas = [
            pessoa(1, 'Participante', Status.ATIVO, [leitor]),
            pessoa(2, 'Ausente', Status.ATIVO, [leitor]),
        ];
        const dias: ScheduleDay[] = ['01', '02', '03', '04'].map(d => ({
            data: `2026-09-${d}`,
            especial: false,
            atribuicoes: [{ funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true }],
        }));
        const result = validateSchedule(baseSchedule(dias), pessoas, funcoes);
        expect(result.warnings.some(w => w.code === 'DIAS_SEM_PARTICIPACAO' && w.pessoaId === 2)).toBe(true);
    });

    it('não acusa pessoa inativa por dias sem participação', () => {
        const pessoas = [
            pessoa(1, 'Participante', Status.ATIVO, [leitor]),
            pessoa(2, 'Inativa', Status.INATIVO, [leitor]),
        ];
        const dias: ScheduleDay[] = ['01', '02', '03', '04'].map(d => ({
            data: `2026-09-${d}`,
            especial: false,
            atribuicoes: [{ funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true }],
        }));
        const result = validateSchedule(baseSchedule(dias), pessoas, funcoes);
        expect(result.warnings.some(w => w.pessoaId === 2)).toBe(false);
    });

    it('acusa atribuição dentro de semana especial', () => {
        const dias: ScheduleDay[] = [{
            data: '2026-09-01',
            especial: true,
            specialWeekId: 1,
            specialWeekNome: 'Congresso',
            atribuicoes: [{ funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true }],
        }];
        const result = validateSchedule(baseSchedule(dias), [pessoa(1, 'A', Status.ATIVO, [leitor])], funcoes);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'ATRIBUICAO_EM_SEMANA_ESPECIAL')).toBe(true);
    });

    it('acusa lacuna quando a célula não está preenchida', () => {
        const dias: ScheduleDay[] = [{ data: '2026-09-01', especial: false, atribuicoes: [{ funcaoId: leitor.id, posicaoId: null, pessoaId: null, manual: false }] }];
        const result = validateSchedule(baseSchedule(dias), [], funcoes);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'LACUNA')).toBe(true);
    });

    it('acusa posição inexistente de uma função', () => {
        const pessoas = [pessoa(1, 'A', Status.ATIVO, [indicador])];
        const dias: ScheduleDay[] = [{ data: '2026-09-01', especial: false, atribuicoes: [{ funcaoId: indicador.id, posicaoId: 99, pessoaId: 1, manual: true }] }];
        const result = validateSchedule(baseSchedule(dias), pessoas, funcoes);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'POSICAO_INVALIDA')).toBe(true);
    });

    it('valida corretamente múltiplas posições da mesma função preenchidas por pessoas distintas', () => {
        const pessoas = [
            pessoa(1, 'A', Status.ATIVO, [indicador]),
            pessoa(2, 'B', Status.ATIVO, [indicador]),
        ];
        const dias: ScheduleDay[] = [{
            data: '2026-09-01',
            especial: false,
            atribuicoes: [
                { funcaoId: indicador.id, posicaoId: 1, pessoaId: 1, manual: true },
                { funcaoId: indicador.id, posicaoId: 2, pessoaId: 2, manual: true },
            ],
        }];
        const result = validateSchedule(baseSchedule(dias), pessoas, funcoes);
        expect(result.valid).toBe(true);
    });

    it('acusa conflito quando a mesma pessoa ocupa duas posições da mesma função no mesmo dia', () => {
        const pessoas = [pessoa(1, 'A', Status.ATIVO, [indicador])];
        const dias: ScheduleDay[] = [{
            data: '2026-09-01',
            especial: false,
            atribuicoes: [
                { funcaoId: indicador.id, posicaoId: 1, pessoaId: 1, manual: true },
                { funcaoId: indicador.id, posicaoId: 2, pessoaId: 1, manual: true },
            ],
        }];
        const result = validateSchedule(baseSchedule(dias), pessoas, funcoes);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'CONFLITO_DIARIO')).toBe(true);
    });

    it('escala válida não possui erros', () => {
        const pessoas = [pessoa(1, 'A', Status.ATIVO, [leitor])];
        const dias: ScheduleDay[] = [{ data: '2026-09-01', especial: false, atribuicoes: [{ funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true }] }];
        const result = validateSchedule(baseSchedule(dias), pessoas, funcoes);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
});
