import { Document, Font, Page, pdf, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { Funcao } from "../../models/Funcao.model";
import { PdfConfig, RGB } from "../../models/PdfConfig.model";
import { Pessoa } from "../../models/Pessoa.model";
import { Schedule } from "../../models/Schedule.model";
import { formatDateBR, monthNamePt, weekdayNamePt } from "../schedule/dateUtils";
import { getFuncaoSlots } from "../schedule/generateSchedule";
import { buildDisplayRows } from "../schedule/scheduleDisplay";
import { abreviarNome } from "../../utils/utils";

Font.registerHyphenationCallback(word => [word]);

const rgbToCss = (c: RGB | undefined) => c ? `rgb(${c.r}, ${c.g}, ${c.b})` : 'rgb(0, 0, 0)';

const PAGE_WIDTH = 595;
const PAGE_PADDING = 16;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING * 2;
const DATA_COL_WIDTH = 62;
const HEADER_ROW1_H = 22;
const HEADER_ROW2_H = 18;
const HEADER_TOTAL_H = HEADER_ROW1_H + HEADER_ROW2_H;

const buildStyles = (pdfConfig: PdfConfig) => {
    const borda = { borderWidth: 0.25, borderColor: rgbToCss(pdfConfig.corBorda), borderStyle: 'solid' as const };

    return {
        ...StyleSheet.create({
            page: { padding: PAGE_PADDING, fontSize: 8, fontFamily: 'Helvetica' },
            titleBar: { backgroundColor: rgbToCss(pdfConfig.corPrincipal), paddingVertical: 12, marginHorizontal: -PAGE_PADDING, marginTop: -PAGE_PADDING },
            titleText: { color: '#ffffff', fontSize: 20, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
            monthBar: { backgroundColor: '#000000', paddingVertical: 5, marginTop: 22, marginBottom: 6 },
            monthBarText: { color: '#ffffff', fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
            headerCellText: { color: '#ffffff', fontSize: 7, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
            dateCellData: { color: '#ffffff', fontSize: 7, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
            dateCellWeekday: { color: '#ffffff', fontSize: 6, textAlign: 'center', marginTop: 1 },
            cellText: { fontSize: 7, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
            specialText: { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: '#000000' },
            footerText: { marginTop: 14, fontSize: 8, fontFamily: 'Helvetica-Oblique', textAlign: 'center', color: rgbToCss(pdfConfig.corSecundaria) },
        }),
        borda,
    };
};

type Props = {
    schedule: Schedule;
    pessoas: Pessoa[];
    funcoes: Funcao[];
    pdfConfig: PdfConfig;
};

export const ScheduleDocument = ({ schedule, pessoas, funcoes, pdfConfig }: Props) => {
    const styles = buildStyles(pdfConfig);

    const funcoesDaEscala = schedule.funcoesIds
        .map(id => funcoes.find(f => f.id === id))
        .filter((f): f is Funcao => !!f);
    const funcaoPorId = new Map(funcoesDaEscala.map(f => [f.id, f]));
    const slots = getFuncaoSlots(funcoesDaEscala);
    const slotWidth = slots.length ? (CONTENT_WIDTH - DATA_COL_WIDTH) / slots.length : CONTENT_WIDTH - DATA_COL_WIDTH;
    const fullWidth = DATA_COL_WIDTH + slotWidth * slots.length;

    const temPosicoesNomeadas = (funcao: Funcao): boolean => {
        const posicoes = funcao.posicoes ?? [];
        return posicoes.length > 1 && posicoes.some(p => p.nome && p.nome.trim());
    };

    const corLinhaFuncao = (funcaoId: number, linhaPar: boolean): string => {
        const funcao = funcaoPorId.get(funcaoId);
        const cor = linhaPar
            ? (funcao?.corPar ?? pdfConfig.corLinhaPar)
            : (funcao?.corImpar ?? pdfConfig.corLinhaImpar);
        return rgbToCss(cor);
    };

    const corFonteFuncao = (funcaoId: number): string => {
        const funcao = funcaoPorId.get(funcaoId);
        return rgbToCss(funcao?.corFonte ?? pdfConfig.corFonte);
    };

    const nomePessoa = (id: number | null) => {
        if (id === null) return '';
        const nome = pessoas.find(p => p.id === id)?.nome ?? '';
        return abreviarNome(nome);
    };

    const linhas = buildDisplayRows(schedule.dias);
    let mesAnoAtual: string | null = null;
    let indiceLinha = 0;

    return (
        <Document title={pdfConfig.titulo}>
            <Page size="A4" style={styles.page}>
                <View style={styles.titleBar}>
                    <Text style={styles.titleText}>{pdfConfig.titulo}</Text>
                </View>

                {linhas.flatMap((linha): ReactElement[] => {
                    const dataReferencia = linha.tipo === 'normal' ? linha.dia.data : linha.dataInicio;
                    const elementos: ReactElement[] = [];
                    const mesAno = dataReferencia.substring(0, 7);

                    if (mesAno !== mesAnoAtual) {
                        mesAnoAtual = mesAno;
                        elementos.push(
                            <View key={`mes-${dataReferencia}`} style={styles.monthBar} wrap={false}>
                                <Text style={styles.monthBarText}>{monthNamePt(dataReferencia)}</Text>
                            </View>
                        );
                        elementos.push(
                            <View key={`cabecalho-${dataReferencia}`} style={{ flexDirection: 'row', backgroundColor: rgbToCss(pdfConfig.corCabecalho), height: HEADER_TOTAL_H }} wrap={false}>
                                <View style={{ width: DATA_COL_WIDTH, height: HEADER_TOTAL_H, justifyContent: 'center', alignItems: 'center', ...styles.borda }}>
                                    <Text style={styles.headerCellText}>Data</Text>
                                </View>
                                {funcoesDaEscala.map(funcao => {
                                    const posicoes = funcao.posicoes ?? [];
                                    const nSlots = posicoes.length || 1;
                                    const groupWidth = slotWidth * nSlots;
                                    if (!temPosicoesNomeadas(funcao)) {
                                        return (
                                            <View key={funcao.id} style={{ width: groupWidth, height: HEADER_TOTAL_H, justifyContent: 'center', alignItems: 'center', ...styles.borda }}>
                                                <Text style={styles.headerCellText}>{funcao.nome}</Text>
                                            </View>
                                        );
                                    }
                                    return (
                                        <View key={funcao.id} style={{ width: groupWidth, height: HEADER_TOTAL_H, ...styles.borda }}>
                                            <View style={{ height: HEADER_ROW1_H, justifyContent: 'center', alignItems: 'center' }}>
                                                <Text style={styles.headerCellText}>{funcao.nome}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', height: HEADER_ROW2_H, backgroundColor: rgbToCss(pdfConfig.corSecundaria) }}>
                                                {posicoes.map(p => (
                                                    <View key={p.id} style={{ width: slotWidth, justifyContent: 'center', alignItems: 'center', ...styles.borda }}>
                                                        <Text style={styles.headerCellText}>{p.nome}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    }

                    if (linha.tipo === 'especial') {
                        const periodo = linha.dataInicio === linha.dataFim
                            ? formatDateBR(linha.dataInicio)
                            : `${formatDateBR(linha.dataInicio)} a ${formatDateBR(linha.dataFim)}`;
                        elementos.push(
                            <View key={`especial-${linha.dataInicio}`} style={{ width: fullWidth, backgroundColor: rgbToCss(pdfConfig.corSemanaEspecial), paddingVertical: 6, ...styles.borda }} wrap={false}>
                                <Text style={styles.specialText}>SEMANA ESPECIAL — {linha.nome?.toUpperCase() ?? ''} ({periodo})</Text>
                            </View>
                        );
                        return elementos;
                    }

                    const dia = linha.dia;
                    indiceLinha++;
                    const linhaPar = indiceLinha % 2 === 0;

                    elementos.push(
                        <View key={dia.data} style={{ flexDirection: 'row' }} wrap={false}>
                            <View style={{ width: DATA_COL_WIDTH, backgroundColor: rgbToCss(pdfConfig.corCabecalho), paddingVertical: 6, justifyContent: 'center', ...styles.borda }}>
                                <Text style={styles.dateCellData}>{formatDateBR(dia.data)}</Text>
                                <Text style={styles.dateCellWeekday}>{weekdayNamePt(dia.data)}</Text>
                            </View>
                            {slots.map((slot, index) => {
                                const atribuicao = dia.atribuicoes.find(a => a.funcaoId === slot.funcaoId && (a.posicaoId ?? null) === slot.posicaoId);
                                const bg = corLinhaFuncao(slot.funcaoId, linhaPar);
                                const corFonte = corFonteFuncao(slot.funcaoId);
                                return (
                                    <View key={index} style={{ width: slotWidth, backgroundColor: bg, paddingVertical: 6, justifyContent: 'center', alignItems: 'center', ...styles.borda }}>
                                        <Text style={{ ...styles.cellText, color: corFonte }}>{nomePessoa(atribuicao?.pessoaId ?? null)}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    );

                    return elementos;
                })}

                <Text style={styles.footerText}>{pdfConfig.versiculo}</Text>
            </Page>
        </Document>
    );
};

export const generateSchedulePdfBlob = async (
    schedule: Schedule,
    pessoas: Pessoa[],
    funcoes: Funcao[],
    pdfConfig: PdfConfig,
): Promise<Blob> => {
    const instance = pdf(
        <ScheduleDocument schedule={schedule} pessoas={pessoas} funcoes={funcoes} pdfConfig={pdfConfig} />
    );
    return instance.toBlob();
};
