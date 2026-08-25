import { describe, expect, it } from 'vitest';
import { validateImportedData } from './importValidation';

describe('validateImportedData', () => {
    it('rejeita valores que não são objeto', () => {
        expect(validateImportedData(null).valid).toBe(false);
        expect(validateImportedData('texto').valid).toBe(false);
        expect(validateImportedData([]).valid).toBe(false);
    });

    it('rejeita ausência de version', () => {
        const result = validateImportedData({ pessoas: [], funcoes: [] });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('version'))).toBe(true);
    });

    it('rejeita campos de lista que não são arrays', () => {
        const result = validateImportedData({ version: 1, pessoas: 'não é lista' });
        expect(result.valid).toBe(false);
    });

    it('rejeita pessoa referenciando função inexistente', () => {
        const result = validateImportedData({
            version: 1,
            funcoes: [{ id: 1, nome: 'Leitor', status: 'ATIVO' }],
            pessoas: [{ id: 1, nome: 'A', status: 'ATIVO', funcoes: [{ id: 99, nome: 'Fantasma' }] }],
        });
        expect(result.valid).toBe(false);
    });

    it('rejeita escala referenciando pessoa inexistente', () => {
        const result = validateImportedData({
            version: 1,
            funcoes: [{ id: 1, nome: 'Leitor', status: 'ATIVO' }],
            pessoas: [],
            schedules: [{ id: 1, nome: 'Teste', dias: [{ data: '2026-09-01', atribuicoes: [{ funcaoId: 1, pessoaId: 42 }] }] }],
        });
        expect(result.valid).toBe(false);
    });

    it('aceita estrutura válida e consistente', () => {
        const result = validateImportedData({
            version: 1,
            funcoes: [{ id: 1, nome: 'Leitor', status: 'ATIVO' }],
            pessoas: [{ id: 1, nome: 'A', status: 'ATIVO', funcoes: [{ id: 1, nome: 'Leitor' }] }],
            specialWeeks: [],
            schedules: [],
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
});
