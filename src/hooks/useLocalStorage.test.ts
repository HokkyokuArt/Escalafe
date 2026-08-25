import { describe, expect, it } from 'vitest';
import { CURRENT_STATE_VERSION, migrateState } from './useLocalStorage';

describe('migrateState', () => {
    it('preenche campos ausentes com valores padrão e define a versão atual', () => {
        const migrated = migrateState({ pessoas: [], funcoes: [] });
        expect(migrated.version).toBe(CURRENT_STATE_VERSION);
        expect(migrated.scheduleConfig).toBeDefined();
        expect(migrated.specialWeeks).toEqual([]);
        expect(migrated.schedules).toEqual([]);
        expect(migrated.pdfConfig).toBeDefined();
    });

    it('preserva dados já existentes ao migrar', () => {
        const migrated = migrateState({
            pessoas: [{ id: 1, nome: 'X', status: 'ATIVO' as any, funcoes: [] }],
        });
        expect(migrated.pessoas).toHaveLength(1);
        expect(migrated.pessoas[0].nome).toBe('X');
    });

    it('preenche posições ausentes em funções antigas', () => {
        const migrated = migrateState({
            funcoes: [
                { id: 1, nome: 'A', status: 'ATIVO' as any } as any,
                { id: 2, nome: 'B', status: 'ATIVO' as any } as any,
            ],
        });
        expect(migrated.funcoes[0].posicoes).toEqual([]);
        expect(migrated.funcoes[1].posicoes).toEqual([]);
    });

    it('preserva posições já existentes em funções migradas', () => {
        const migrated = migrateState({
            funcoes: [{ id: 1, nome: 'A', status: 'ATIVO' as any, posicoes: [{ id: 1, nome: 'X' }] } as any],
        });
        expect(migrated.funcoes[0].posicoes).toEqual([{ id: 1, nome: 'X' }]);
    });

    it('preserva a cor customizada de uma função ao migrar', () => {
        const migrated = migrateState({
            funcoes: [{ id: 1, nome: 'A', status: 'ATIVO' as any, corPar: { r: 1, g: 2, b: 3 }, corImpar: { r: 4, g: 5, b: 6 } } as any],
        });
        expect(migrated.funcoes[0].corPar).toEqual({ r: 1, g: 2, b: 3 });
        expect(migrated.funcoes[0].corImpar).toEqual({ r: 4, g: 5, b: 6 });
    });

    it('não define cor customizada quando a função não possui uma', () => {
        const migrated = migrateState({
            funcoes: [{ id: 1, nome: 'A', status: 'ATIVO' as any } as any],
        });
        expect(migrated.funcoes[0].corPar).toBeUndefined();
        expect(migrated.funcoes[0].corImpar).toBeUndefined();
    });

    it('migra também as funções aninhadas dentro de pessoas', () => {
        const migrated = migrateState({
            pessoas: [{ id: 1, nome: 'X', status: 'ATIVO' as any, funcoes: [{ id: 1, nome: 'A', status: 'ATIVO' as any } as any] }],
        });
        expect(migrated.pessoas[0].funcoes[0].posicoes).toEqual([]);
    });

    it('preenche campos novos do pdfConfig sem descartar os já configurados', () => {
        const migrated = migrateState({
            pdfConfig: { corPrincipal: { r: 1, g: 2, b: 3 }, quantidadeMeses: 2 } as any,
        });
        expect(migrated.pdfConfig.corPrincipal).toEqual({ r: 1, g: 2, b: 3 });
        expect(migrated.pdfConfig.quantidadeMeses).toBe(2);
        expect(migrated.pdfConfig.titulo).toBeDefined();
        expect(migrated.pdfConfig.corLinhaPar).toBeDefined();
        expect(migrated.pdfConfig.corLinhaImpar).toBeDefined();
        expect(migrated.pdfConfig.corFonte).toBeDefined();
        expect(migrated.pdfConfig.corBorda).toBeDefined();
    });

    it('preenche campos novos do scheduleConfig sem descartar os já configurados', () => {
        const migrated = migrateState({
            scheduleConfig: { diasSemana: [1, 2] } as any,
        });
        expect(migrated.scheduleConfig.diasSemana).toEqual([1, 2]);
        expect(migrated.scheduleConfig.ultimaOrdemFuncoes).toEqual([]);
    });

    it('preserva a última ordem de funções já configurada', () => {
        const migrated = migrateState({
            scheduleConfig: { diasSemana: [0], ultimaOrdemFuncoes: [3, 1, 2] } as any,
        });
        expect(migrated.scheduleConfig.ultimaOrdemFuncoes).toEqual([3, 1, 2]);
    });
});
