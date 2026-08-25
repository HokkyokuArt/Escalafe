export type ImportValidationResult = {
    valid: boolean;
    errors: string[];
};

const arrayFields = ['pessoas', 'funcoes', 'specialWeeks', 'schedules'] as const;

export const validateImportedData = (data: any): ImportValidationResult => {
    const errors: string[] = [];

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return { valid: false, errors: ['O arquivo não contém um objeto JSON válido.'] };
    }

    if (typeof data.version !== 'number') {
        errors.push('Campo "version" ausente ou inválido.');
    }

    arrayFields.forEach(field => {
        if (data[field] !== undefined && !Array.isArray(data[field])) {
            errors.push(`Campo "${field}" deveria ser uma lista.`);
        }
    });

    if (errors.length) {
        return { valid: false, errors };
    }

    const funcaoIds = new Set((data.funcoes ?? []).map((f: any) => f.id));
    const pessoaIds = new Set((data.pessoas ?? []).map((p: any) => p.id));

    (data.pessoas ?? []).forEach((p: any) => {
        if (typeof p.nome !== 'string' || !p.nome) {
            errors.push(`Pessoa com id ${p.id} sem nome válido.`);
        }
        (p.funcoes ?? []).forEach((f: any) => {
            if (!funcaoIds.has(f.id)) {
                errors.push(`Pessoa "${p.nome}" referencia função inexistente (id ${f.id}).`);
            }
        });
    });

    (data.schedules ?? []).forEach((s: any) => {
        (s.dias ?? []).forEach((dia: any) => {
            (dia.atribuicoes ?? []).forEach((a: any) => {
                if (!funcaoIds.has(a.funcaoId)) {
                    errors.push(`Escala "${s.nome}" referencia função inexistente (id ${a.funcaoId}).`);
                }
                if (a.pessoaId !== null && a.pessoaId !== undefined && !pessoaIds.has(a.pessoaId)) {
                    errors.push(`Escala "${s.nome}" referencia pessoa inexistente (id ${a.pessoaId}).`);
                }
            });
        });
    });

    return { valid: errors.length === 0, errors };
};
