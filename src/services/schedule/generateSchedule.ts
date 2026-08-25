import { Status } from "../../enum/Status";
import { Funcao } from "../../models/Funcao.model";
import { Pessoa } from "../../models/Pessoa.model";
import { Assignment, ScheduleDay } from "../../models/Schedule.model";
import { DiaSemana, ScheduleConfig } from "../../models/ScheduleConfig.model";
import { SpecialWeek } from "../../models/SpecialWeek.model";
import { parseISODate, toISODate, weekKeyFor } from "./dateUtils";

export type ScheduleSlot = {
    funcaoId: number;
    posicaoId: number | null;
};

export type GenerationGap = {
    data: string;
    funcaoId: number;
    posicaoId: number | null;
    motivo: string;
};

export type GenerationResult = {
    dias: ScheduleDay[];
    gaps: GenerationGap[];
};

export const getFuncaoSlots = (funcoesSelecionadas: Funcao[]): ScheduleSlot[] => {
    return funcoesSelecionadas.flatMap((f): ScheduleSlot[] => {
        const posicoes = f.posicoes ?? [];
        return posicoes.length
            ? posicoes.map(p => ({ funcaoId: f.id, posicaoId: p.id }))
            : [{ funcaoId: f.id, posicaoId: null }];
    });
};

const slotLabel = (funcoes: Funcao[], funcaoId: number, posicaoId: number | null): string => {
    const funcao = funcoes.find(f => f.id === funcaoId);
    if (!funcao) return '';
    if (posicaoId === null) return funcao.nome;
    const posicao = (funcao.posicoes ?? []).find(p => p.id === posicaoId);
    return posicao && posicao.nome ? `${funcao.nome} - ${posicao.nome}` : funcao.nome;
};

export const buildScheduleDays = (
    dataInicio: string,
    dataFim: string,
    scheduleConfig: Pick<ScheduleConfig, 'diasSemana'>,
    specialWeeks: SpecialWeek[],
    slots: ScheduleSlot[],
): ScheduleDay[] => {
    const dias: ScheduleDay[] = [];
    const start = parseISODate(dataInicio);
    const end = parseISODate(dataFim);

    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const diaSemana = d.getDay() as DiaSemana;
        if (!scheduleConfig.diasSemana.includes(diaSemana)) continue;

        const iso = toISODate(d);
        const special = specialWeeks.find(sw => iso >= sw.dataInicio && iso <= sw.dataFim);

        dias.push({
            data: iso,
            especial: !!special,
            specialWeekId: special?.id,
            specialWeekNome: special?.nome,
            atribuicoes: special
                ? []
                : slots.map((slot): Assignment => ({ funcaoId: slot.funcaoId, posicaoId: slot.posicaoId, pessoaId: null, manual: false })),
        });
    }

    return dias;
};

const chaveSlot = (funcaoId: number, posicaoId: number | null): string => `${funcaoId}:${posicaoId}`;

export const autoFillSchedule = (
    dias: ScheduleDay[],
    pessoas: Pessoa[],
    funcoes: Funcao[],
): GenerationResult => {
    const result = dias.map(dia => ({ ...dia, atribuicoes: dia.atribuicoes.map(a => ({ ...a })) }));
    const gaps: GenerationGap[] = [];
    const pessoasAtivas = pessoas.filter(p => p.status === Status.ATIVO);
    const funcaoPorId = new Map(funcoes.map(f => [f.id, f]));
    const ehRotatividadeMaxima = (funcaoId: number) => !!funcaoPorId.get(funcaoId)?.rotatividadeMaxima;

    const participatesOnDay = (dayIndex: number, pessoaId: number) =>
        result[dayIndex].atribuicoes.some(a => a.pessoaId === pessoaId);

    const consecutiveCountBefore = (dayIndex: number, pessoaId: number): number => {
        let count = 0;
        for (let i = dayIndex - 1; i >= 0; i--) {
            if (result[i].especial) break;
            if (participatesOnDay(i, pessoaId)) count++;
            else break;
        }
        return count;
    };

    const idleDaysBefore = (dayIndex: number, pessoaId: number): number => {
        let count = 0;
        for (let i = dayIndex - 1; i >= 0; i--) {
            if (result[i].especial) continue;
            if (participatesOnDay(i, pessoaId)) break;
            count++;
        }
        return count;
    };

    const ultimaAtribuicaoSlot = (antesDoIndex: number, funcaoId: number, posicaoId: number | null): { pessoaId: number; semanaKey: string; } | null => {
        for (let i = antesDoIndex - 1; i >= 0; i--) {
            if (result[i].especial) continue;
            const a = result[i].atribuicoes.find(x => x.funcaoId === funcaoId && x.posicaoId === posicaoId);
            if (a?.pessoaId != null) return { pessoaId: a.pessoaId, semanaKey: weekKeyFor(result[i].data) };
        }
        return null;
    };

    const semanasAdjacentes = (semanaA: string, semanaB: string): boolean => {
        const diffDias = Math.round(Math.abs(parseISODate(semanaA).getTime() - parseISODate(semanaB).getTime()) / (1000 * 60 * 60 * 24));
        return diffDias === 7;
    };

    const cicloRotatividade = new Map<string, Set<number>>();

    const escolherCandidato = (dayIndexRef: number, diasParaConflito: number[], funcaoId: number, posicaoId: number | null): Pessoa | null => {
        const elegiveis = pessoasAtivas.filter(p =>
            p.funcoes.some(f => f.id === funcaoId) &&
            diasParaConflito.every(di => !participatesOnDay(di, p.id))
        );

        if (!elegiveis.length) return null;

        const semViolarConsecutivos = elegiveis.filter(p => consecutiveCountBefore(dayIndexRef, p.id) < 3);
        let candidatos = semViolarConsecutivos.length ? semViolarConsecutivos : elegiveis;

        const ultimaAtribuicao = ultimaAtribuicaoSlot(dayIndexRef, funcaoId, posicaoId);
        if (ultimaAtribuicao && semanasAdjacentes(ultimaAtribuicao.semanaKey, weekKeyFor(result[dayIndexRef].data))) {
            const semRepetirFuncao = candidatos.filter(p => p.id !== ultimaAtribuicao.pessoaId);
            if (semRepetirFuncao.length) candidatos = semRepetirFuncao;
        }

        if (ehRotatividadeMaxima(funcaoId)) {
            const key = chaveSlot(funcaoId, posicaoId);
            const poolCompleto = pessoasAtivas.filter(p => p.funcoes.some(f => f.id === funcaoId)).length;
            let usados = cicloRotatividade.get(key);
            if (!usados) {
                usados = new Set();
                cicloRotatividade.set(key, usados);
            }
            if (usados.size >= poolCompleto) usados.clear();

            const semUsoNoCiclo = candidatos.filter(p => !usados!.has(p.id));
            if (semUsoNoCiclo.length) candidatos = semUsoNoCiclo;
            else usados.clear();
        }

        const maxIdle = Math.max(...candidatos.map(p => idleDaysBefore(dayIndexRef, p.id)));
        const melhores = candidatos.filter(p => idleDaysBefore(dayIndexRef, p.id) === maxIdle);

        const escolhido = melhores[Math.floor(Math.random() * melhores.length)];

        if (ehRotatividadeMaxima(funcaoId)) {
            cicloRotatividade.get(chaveSlot(funcaoId, posicaoId))!.add(escolhido.id);
        }

        return escolhido;
    };

    const gruposSemana = new Map<string, number[]>();
    result.forEach((dia, index) => {
        if (dia.especial) return;
        const key = weekKeyFor(dia.data);
        if (!gruposSemana.has(key)) gruposSemana.set(key, []);
        gruposSemana.get(key)!.push(index);
    });

    const funcoesSemanaisIds = new Set(funcoes.filter(f => f.designacaoSemana).map(f => f.id));

    gruposSemana.forEach(dayIndexes => {
        if (funcoesSemanaisIds.size) {
            const slotsSemanais = new Map<string, { funcaoId: number; posicaoId: number | null; }>();
            dayIndexes.forEach(di => {
                result[di].atribuicoes.forEach(a => {
                    if (funcoesSemanaisIds.has(a.funcaoId)) {
                        slotsSemanais.set(chaveSlot(a.funcaoId, a.posicaoId), { funcaoId: a.funcaoId, posicaoId: a.posicaoId });
                    }
                });
            });

            slotsSemanais.forEach(({ funcaoId, posicaoId }) => {
                const diasDoSlot = dayIndexes.filter(di => result[di].atribuicoes.some(a => a.funcaoId === funcaoId && a.posicaoId === posicaoId));
                if (!diasDoSlot.length) return;

                const jaAtribuido = diasDoSlot
                    .map(di => result[di].atribuicoes.find(a => a.funcaoId === funcaoId && a.posicaoId === posicaoId))
                    .find(a => a?.pessoaId != null);

                if (jaAtribuido) {
                    diasDoSlot.forEach(di => {
                        const a = result[di].atribuicoes.find(x => x.funcaoId === funcaoId && x.posicaoId === posicaoId)!;
                        if (a.pessoaId === null) {
                            a.pessoaId = jaAtribuido.pessoaId;
                            a.manual = false;
                        }
                    });
                    return;
                }

                const diaReferencia = diasDoSlot[0];
                const escolhido = escolherCandidato(diaReferencia, diasDoSlot, funcaoId, posicaoId);

                if (!escolhido) {
                    diasDoSlot.forEach(di => {
                        gaps.push({
                            data: result[di].data,
                            funcaoId,
                            posicaoId,
                            motivo: `Nenhuma pessoa elegível disponível respeitando todas as regras para ${slotLabel(funcoes, funcaoId, posicaoId)}.`,
                        });
                    });
                    return;
                }

                diasDoSlot.forEach(di => {
                    const a = result[di].atribuicoes.find(x => x.funcaoId === funcaoId && x.posicaoId === posicaoId)!;
                    a.pessoaId = escolhido.id;
                    a.manual = false;
                });
            });
        }

        dayIndexes.forEach(dayIndex => {
            result[dayIndex].atribuicoes.forEach(atribuicao => {
                if (atribuicao.pessoaId !== null) return;
                if (funcoesSemanaisIds.has(atribuicao.funcaoId)) return;

                const escolhido = escolherCandidato(dayIndex, [dayIndex], atribuicao.funcaoId, atribuicao.posicaoId);

                if (!escolhido) {
                    gaps.push({
                        data: result[dayIndex].data,
                        funcaoId: atribuicao.funcaoId,
                        posicaoId: atribuicao.posicaoId,
                        motivo: `Nenhuma pessoa elegível disponível respeitando todas as regras para ${slotLabel(funcoes, atribuicao.funcaoId, atribuicao.posicaoId)}.`,
                    });
                    return;
                }

                atribuicao.pessoaId = escolhido.id;
                atribuicao.manual = false;
            });
        });
    });

    return { dias: result, gaps };
};

export const generateSchedule = (
    dataInicio: string,
    dataFim: string,
    scheduleConfig: Pick<ScheduleConfig, 'diasSemana'>,
    specialWeeks: SpecialWeek[],
    slots: ScheduleSlot[],
    pessoas: Pessoa[],
    funcoes: Funcao[],
): GenerationResult => {
    const skeleton = buildScheduleDays(dataInicio, dataFim, scheduleConfig, specialWeeks, slots);
    return autoFillSchedule(skeleton, pessoas, funcoes);
};
