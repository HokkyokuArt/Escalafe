import { Status } from "../../enum/Status";
import { Funcao } from "../../models/Funcao.model";
import { Pessoa } from "../../models/Pessoa.model";
import { Schedule } from "../../models/Schedule.model";

export type ValidationIssue = {
    code: string;
    message: string;
    data?: string;
    funcaoId?: number;
    posicaoId?: number | null;
    pessoaId?: number;
};

export type ValidationResult = {
    valid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
};

export const validateSchedule = (
    schedule: Schedule,
    pessoas: Pessoa[],
    funcoes: Funcao[],
): ValidationResult => {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    const labelSlot = (funcao: Funcao, posicaoId: number | null): string => {
        if (posicaoId === null) return funcao.nome;
        const posicao = (funcao.posicoes ?? []).find(p => p.id === posicaoId);
        return posicao && posicao.nome ? `${funcao.nome} - ${posicao.nome}` : funcao.nome;
    };

    const dias = schedule.dias.map(dia => {
        const isValidDate = !isNaN(new Date(`${dia.data}T00:00:00`).getTime());
        if (!isValidDate) {
            errors.push({ code: 'DATA_INVALIDA', message: `Data inválida: ${dia.data}`, data: dia.data });
        }
        return dia;
    });

    dias.forEach(dia => {
        if (dia.especial) {
            dia.atribuicoes.forEach(atribuicao => {
                if (atribuicao.pessoaId !== null) {
                    errors.push({
                        code: 'ATRIBUICAO_EM_SEMANA_ESPECIAL',
                        message: `${dia.data} — atribuição encontrada dentro de semana especial (${dia.specialWeekNome ?? ''}).`,
                        data: dia.data,
                        funcaoId: atribuicao.funcaoId,
                        posicaoId: atribuicao.posicaoId,
                        pessoaId: atribuicao.pessoaId ?? undefined,
                    });
                }
            });
            return;
        }

        const pessoaIdsNoDia: number[] = [];

        dia.atribuicoes.forEach(atribuicao => {
            const funcao = funcoes.find(f => f.id === atribuicao.funcaoId);
            if (!funcao) {
                errors.push({
                    code: 'FUNCAO_INVALIDA',
                    message: `${dia.data} — função ${atribuicao.funcaoId} não existe mais.`,
                    data: dia.data,
                    funcaoId: atribuicao.funcaoId,
                    posicaoId: atribuicao.posicaoId,
                });
                return;
            }

            if (atribuicao.posicaoId !== null && !(funcao.posicoes ?? []).some(p => p.id === atribuicao.posicaoId)) {
                errors.push({
                    code: 'POSICAO_INVALIDA',
                    message: `${dia.data} — posição ${atribuicao.posicaoId} de ${funcao.nome} não existe mais.`,
                    data: dia.data,
                    funcaoId: atribuicao.funcaoId,
                    posicaoId: atribuicao.posicaoId,
                });
                return;
            }

            const label = labelSlot(funcao, atribuicao.posicaoId);

            if (atribuicao.pessoaId === null) {
                errors.push({
                    code: 'LACUNA',
                    message: `${dia.data} — ${label} não possui pessoa atribuída.`,
                    data: dia.data,
                    funcaoId: atribuicao.funcaoId,
                    posicaoId: atribuicao.posicaoId,
                });
                return;
            }

            const pessoa = pessoas.find(p => p.id === atribuicao.pessoaId);
            if (!pessoa) {
                errors.push({
                    code: 'PESSOA_INVALIDA',
                    message: `${dia.data} — ${label}: pessoa ${atribuicao.pessoaId} não existe mais.`,
                    data: dia.data,
                    funcaoId: atribuicao.funcaoId,
                    posicaoId: atribuicao.posicaoId,
                    pessoaId: atribuicao.pessoaId,
                });
                return;
            }

            if (!pessoa.funcoes.some(f => f.id === funcao.id)) {
                errors.push({
                    code: 'FUNCAO_INCOMPATIVEL',
                    message: `${dia.data} — ${pessoa.nome} não possui a função ${funcao.nome}.`,
                    data: dia.data,
                    funcaoId: atribuicao.funcaoId,
                    posicaoId: atribuicao.posicaoId,
                    pessoaId: atribuicao.pessoaId,
                });
            }

            if (!atribuicao.manual && pessoa.status !== Status.ATIVO) {
                errors.push({
                    code: 'PESSOA_INATIVA',
                    message: `${dia.data} — ${pessoa.nome} está inativa e foi atribuída automaticamente a ${label}.`,
                    data: dia.data,
                    funcaoId: atribuicao.funcaoId,
                    posicaoId: atribuicao.posicaoId,
                    pessoaId: atribuicao.pessoaId,
                });
            }

            if (pessoaIdsNoDia.includes(pessoa.id)) {
                errors.push({
                    code: 'CONFLITO_DIARIO',
                    message: `${dia.data} — ${pessoa.nome} está atribuída a mais de uma função no mesmo dia.`,
                    data: dia.data,
                    funcaoId: atribuicao.funcaoId,
                    posicaoId: atribuicao.posicaoId,
                    pessoaId: atribuicao.pessoaId,
                });
            } else {
                pessoaIdsNoDia.push(pessoa.id);
            }
        });
    });

    const participaEm = (dayIndex: number, pessoaId: number) =>
        dias[dayIndex].atribuicoes.some(a => a.pessoaId === pessoaId);

    pessoas.forEach(pessoa => {
        let consecutivos = 0;
        let ociosos = 0;

        dias.forEach((dia, index) => {
            if (dia.especial) return;

            if (participaEm(index, pessoa.id)) {
                consecutivos++;
                ociosos = 0;
                if (consecutivos > 3) {
                    warnings.push({
                        code: 'DIAS_CONSECUTIVOS',
                        message: `${pessoa.nome} foi atribuída em ${consecutivos} dias consecutivos (${dia.data}).`,
                        data: dia.data,
                        pessoaId: pessoa.id,
                    });
                }
            } else {
                consecutivos = 0;
                ociosos++;
                if (ociosos > 3 && pessoa.status === Status.ATIVO) {
                    warnings.push({
                        code: 'DIAS_SEM_PARTICIPACAO',
                        message: `${pessoa.nome} está há ${ociosos} dias elegíveis sem participação (${dia.data}).`,
                        data: dia.data,
                        pessoaId: pessoa.id,
                    });
                }
            }
        });
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};
