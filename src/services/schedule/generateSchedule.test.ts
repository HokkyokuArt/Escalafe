import { describe, expect, it } from 'vitest';
import { Status } from '../../enum/Status';
import { Funcao } from '../../models/Funcao.model';
import { Pessoa } from '../../models/Pessoa.model';
import { ScheduleConfig } from '../../models/ScheduleConfig.model';
import { SpecialWeek } from '../../models/SpecialWeek.model';
import { autoFillSchedule, buildScheduleDays, generateSchedule, getFuncaoSlots, ScheduleSlot } from './generateSchedule';

const leitor: Funcao = { id: 1, nome: 'Leitor', status: Status.ATIVO, posicoes: [] };
const microfone: Funcao = { id: 2, nome: 'Microfone', status: Status.ATIVO, posicoes: [] };
const funcoes = [leitor, microfone];

const pessoa = (id: number, nome: string, status: Status, funcs: Funcao[]): Pessoa => ({
    id, nome, status, funcoes: funcs,
});

const config: Pick<ScheduleConfig, 'diasSemana'> = { diasSemana: [0, 1, 2, 3, 4, 5, 6] };

const slotsFor = (...fs: Funcao[]): ScheduleSlot[] => getFuncaoSlots(fs);
const slotLeitor: ScheduleSlot[] = slotsFor(leitor);

describe('getFuncaoSlots', () => {
    it('gera um slot por função quando não há posições', () => {
        expect(getFuncaoSlots([leitor, microfone])).toEqual([
            { funcaoId: leitor.id, posicaoId: null },
            { funcaoId: microfone.id, posicaoId: null },
        ]);
    });

    it('expande uma função com posições em um slot por posição', () => {
        const indicador: Funcao = {
            id: 3, nome: 'Indicador', status: Status.ATIVO,
            posicoes: [{ id: 1, nome: 'Entrada' }, { id: 2, nome: 'Corredor' }, { id: 3, nome: 'Saída' }],
        };
        expect(getFuncaoSlots([indicador])).toEqual([
            { funcaoId: indicador.id, posicaoId: 1 },
            { funcaoId: indicador.id, posicaoId: 2 },
            { funcaoId: indicador.id, posicaoId: 3 },
        ]);
    });
});

describe('buildScheduleDays', () => {
    it('gera apenas os dias da semana configurados', () => {
        const dias = buildScheduleDays('2026-09-01', '2026-09-07', { diasSemana: [2] }, [], slotLeitor);
        expect(dias).toHaveLength(1);
        expect(dias[0].data).toBe('2026-09-01');
    });

    it('marca dias dentro de semanas especiais e não cria atribuições para eles', () => {
        const specialWeeks: SpecialWeek[] = [{ id: 1, nome: 'Congresso', dataInicio: '2026-09-01', dataFim: '2026-09-01' }];
        const dias = buildScheduleDays('2026-09-01', '2026-09-01', config, specialWeeks, slotLeitor);
        expect(dias[0].especial).toBe(true);
        expect(dias[0].atribuicoes).toHaveLength(0);
    });

    it('cria uma atribuição por posição de uma função com sub-posições', () => {
        const microfone2x: Funcao = { ...microfone, posicoes: [{ id: 1, nome: '1' }, { id: 2, nome: '2' }] };
        const dias = buildScheduleDays('2026-09-01', '2026-09-01', config, [], slotsFor(microfone2x));
        expect(dias[0].atribuicoes).toHaveLength(2);
        expect(dias[0].atribuicoes.map(a => a.posicaoId)).toEqual([1, 2]);
    });
});

describe('autoFillSchedule', () => {
    it('não atribui pessoa inativa', () => {
        const pessoas = [pessoa(1, 'Inativo', Status.INATIVO, [leitor])];
        const dias = buildScheduleDays('2026-09-01', '2026-09-01', config, [], slotLeitor);
        const { dias: result, gaps } = autoFillSchedule(dias, pessoas, funcoes);
        expect(result[0].atribuicoes[0].pessoaId).toBeNull();
        expect(gaps).toHaveLength(1);
    });

    it('não atribui pessoa sem a função', () => {
        const pessoas = [pessoa(1, 'SemFuncao', Status.ATIVO, [microfone])];
        const dias = buildScheduleDays('2026-09-01', '2026-09-01', config, [], slotLeitor);
        const { dias: result, gaps } = autoFillSchedule(dias, pessoas, funcoes);
        expect(result[0].atribuicoes[0].pessoaId).toBeNull();
        expect(gaps).toHaveLength(1);
    });

    it('não atribui a mesma pessoa a duas funções no mesmo dia', () => {
        const pessoas = [pessoa(1, 'Unica', Status.ATIVO, [leitor, microfone])];
        const dias = buildScheduleDays('2026-09-01', '2026-09-01', config, [], slotsFor(leitor, microfone));
        const { dias: result, gaps } = autoFillSchedule(dias, pessoas, funcoes);
        const atribuidos = result[0].atribuicoes.filter(a => a.pessoaId !== null);
        expect(atribuidos).toHaveLength(1);
        expect(gaps).toHaveLength(1);
    });

    it('não atribui a mesma pessoa a duas posições da mesma função no mesmo dia', () => {
        const microfone2x: Funcao = { ...microfone, posicoes: [{ id: 1, nome: '1' }, { id: 2, nome: '2' }] };
        const pessoas = [pessoa(1, 'Unica', Status.ATIVO, [microfone2x])];
        const dias = buildScheduleDays('2026-09-01', '2026-09-01', config, [], slotsFor(microfone2x));
        const { dias: result, gaps } = autoFillSchedule(dias, pessoas, [microfone2x]);
        const atribuidos = result[0].atribuicoes.filter(a => a.pessoaId !== null);
        expect(atribuidos).toHaveLength(1);
        expect(gaps).toHaveLength(1);
    });

    it('preenche todas as posições de uma função quando há pessoas suficientes', () => {
        const microfone2x: Funcao = { ...microfone, posicoes: [{ id: 1, nome: '1' }, { id: 2, nome: '2' }] };
        const pessoas = [
            pessoa(1, 'A', Status.ATIVO, [microfone2x]),
            pessoa(2, 'B', Status.ATIVO, [microfone2x]),
        ];
        const dias = buildScheduleDays('2026-09-01', '2026-09-01', config, [], slotsFor(microfone2x));
        const { dias: result, gaps } = autoFillSchedule(dias, pessoas, [microfone2x]);
        expect(result[0].atribuicoes.every(a => a.pessoaId !== null)).toBe(true);
        expect(gaps).toHaveLength(0);
    });

    it('evita mais de 3 dias consecutivos quando há alternativa', () => {
        const pessoas = [
            pessoa(1, 'A', Status.ATIVO, [leitor]),
            pessoa(2, 'B', Status.ATIVO, [leitor]),
        ];
        const dias = buildScheduleDays('2026-09-01', '2026-09-06', config, [], slotLeitor);
        const { dias: result } = autoFillSchedule(dias, pessoas, [leitor]);
        const sequenciaA = result.map(d => d.atribuicoes[0].pessoaId === 1);
        let maxConsecutivos = 0;
        let atual = 0;
        sequenciaA.forEach(participou => {
            atual = participou ? atual + 1 : 0;
            maxConsecutivos = Math.max(maxConsecutivos, atual);
        });
        expect(maxConsecutivos).toBeLessThanOrEqual(3);
    });

    it('prioriza quem está há mais tempo sem participar', () => {
        const pessoas = [
            pessoa(1, 'MaisRecente', Status.ATIVO, [leitor]),
            pessoa(2, 'MaisAntigo', Status.ATIVO, [leitor]),
        ];
        const dias = buildScheduleDays('2026-09-01', '2026-09-02', config, [], slotLeitor);
        dias[0].atribuicoes[0] = { funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true };
        const { dias: result } = autoFillSchedule(dias, pessoas, [leitor]);
        expect(result[1].atribuicoes[0].pessoaId).toBe(2);
    });

    it('não sobrescreve atribuições manuais já preenchidas', () => {
        const pessoas = [
            pessoa(1, 'Manual', Status.ATIVO, [leitor]),
            pessoa(2, 'Automatico', Status.ATIVO, [leitor]),
        ];
        const dias = buildScheduleDays('2026-09-01', '2026-09-01', config, [], slotLeitor);
        dias[0].atribuicoes[0] = { funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true };
        const { dias: result } = autoFillSchedule(dias, pessoas, [leitor]);
        expect(result[0].atribuicoes[0].pessoaId).toBe(1);
        expect(result[0].atribuicoes[0].manual).toBe(true);
    });

    it('preenche apenas as lacunas de uma escala parcialmente preenchida', () => {
        const pessoas = [pessoa(1, 'A', Status.ATIVO, [leitor, microfone])];
        const dias = buildScheduleDays('2026-09-01', '2026-09-01', config, [], slotsFor(leitor, microfone));
        dias[0].atribuicoes[0] = { funcaoId: leitor.id, posicaoId: null, pessoaId: 1, manual: true };
        const { dias: result, gaps } = autoFillSchedule(dias, pessoas, funcoes);
        expect(result[0].atribuicoes[0].pessoaId).toBe(1);
        expect(result[0].atribuicoes[1].pessoaId).toBeNull();
        expect(gaps).toHaveLength(1);
    });

    it('reporta lacuna quando não há candidatos elegíveis', () => {
        const dias = buildScheduleDays('2026-09-01', '2026-09-01', config, [], slotLeitor);
        const { gaps } = autoFillSchedule(dias, [], funcoes);
        expect(gaps).toHaveLength(1);
        expect(gaps[0].funcaoId).toBe(leitor.id);
    });

    it('não trava mesmo com um período longo e poucas pessoas', () => {
        const pessoas = [pessoa(1, 'Unica', Status.ATIVO, [leitor])];
        const dias = buildScheduleDays('2026-01-01', '2026-12-31', config, [], slotLeitor);
        expect(() => autoFillSchedule(dias, pessoas, [leitor])).not.toThrow();
    });

    it('evita repetir a mesma pessoa na mesma função em semanas subsequentes quando há alternativa', () => {
        const pessoas = [
            pessoa(1, 'A', Status.ATIVO, [leitor]),
            pessoa(2, 'B', Status.ATIVO, [leitor]),
        ];
        const semanal: Pick<ScheduleConfig, 'diasSemana'> = { diasSemana: [0] };
        const dias = buildScheduleDays('2026-09-06', '2026-09-27', semanal, [], slotLeitor);
        const { dias: result } = autoFillSchedule(dias, pessoas, [leitor]);
        expect(result).toHaveLength(4);
        for (let i = 1; i < result.length; i++) {
            expect(result[i].atribuicoes[0].pessoaId).not.toBe(result[i - 1].atribuicoes[0].pessoaId);
        }
    });

    it('designação semanal mantém a mesma pessoa em todos os dias da mesma semana', () => {
        const indicador: Funcao = { id: 3, nome: 'Indicador', status: Status.ATIVO, posicoes: [], designacaoSemana: true };
        const pessoas = [
            pessoa(1, 'A', Status.ATIVO, [indicador]),
            pessoa(2, 'B', Status.ATIVO, [indicador]),
        ];
        const semanal: Pick<ScheduleConfig, 'diasSemana'> = { diasSemana: [0, 3] };
        const dias = buildScheduleDays('2026-09-02', '2026-09-13', semanal, [], slotsFor(indicador));
        const { dias: result } = autoFillSchedule(dias, pessoas, [indicador]);
        expect(result).toHaveLength(4);
        expect(result[0].atribuicoes[0].pessoaId).toBe(result[1].atribuicoes[0].pessoaId);
        expect(result[2].atribuicoes[0].pessoaId).toBe(result[3].atribuicoes[0].pessoaId);
    });

    it('rotatividade máxima só repete uma pessoa depois que todas as outras já participaram', () => {
        const indicador: Funcao = { id: 3, nome: 'Indicador', status: Status.ATIVO, posicoes: [], rotatividadeMaxima: true };
        const pessoas = [
            pessoa(1, 'A', Status.ATIVO, [indicador]),
            pessoa(2, 'B', Status.ATIVO, [indicador]),
            pessoa(3, 'C', Status.ATIVO, [indicador]),
        ];
        const semanal: Pick<ScheduleConfig, 'diasSemana'> = { diasSemana: [0] };
        const dias = buildScheduleDays('2026-09-06', '2026-10-25', semanal, [], slotsFor(indicador));
        const { dias: result } = autoFillSchedule(dias, pessoas, [indicador]);
        const sequencia = result.map(d => d.atribuicoes[0].pessoaId);
        for (let i = 0; i + 2 < sequencia.length; i += 3) {
            const trinca = new Set(sequencia.slice(i, i + 3));
            expect(trinca.size).toBe(3);
        }
    });
});

describe('generateSchedule', () => {
    it('gera escala completa a partir do zero', () => {
        const pessoas = [
            pessoa(1, 'A', Status.ATIVO, [leitor, microfone]),
            pessoa(2, 'B', Status.ATIVO, [leitor, microfone]),
        ];
        const { dias, gaps } = generateSchedule('2026-09-01', '2026-09-07', config, [], slotsFor(leitor, microfone), pessoas, funcoes);
        expect(dias.length).toBeGreaterThan(0);
        expect(gaps).toHaveLength(0);
    });
});
