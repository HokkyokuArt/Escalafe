import { Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, useTheme } from "@mui/material";
import Grid from '@mui/material/Grid2';
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomDialog, { DialogProps } from "../components/CustomDialog";
import CustomIcon from "../components/CustomIcon";
import DateFieldBR from "../components/DateFieldBR";
import FloatingActionsComponent, { FloatingActions } from "../components/FloatingActions";
import { Status } from "../enum/Status";
import useGenerateID from "../hooks/useGenerateID";
import useLocalStorage from "../hooks/useLocalStorage";
import { Funcao } from "../models/Funcao.model";
import { Schedule, ScheduleStatus } from "../models/Schedule.model";
import { DiaSemana, diasSemanaLabel } from "../models/ScheduleConfig.model";
import { generateSchedulePdfBlob } from "../services/pdf/ScheduleDocument";
import { addMonths, formatDateBR } from "../services/schedule/dateUtils";
import { autoFillSchedule, buildScheduleDays, GenerationGap, getFuncaoSlots } from "../services/schedule/generateSchedule";
import { buildDisplayRows } from "../services/schedule/scheduleDisplay";
import { validateSchedule, ValidationResult } from "../services/validation/validateSchedule";
import { sortArray } from "../utils/utils";

const ordenarPorUltimaOrdem = (lista: Funcao[], ultimaOrdem: number[] | undefined): Funcao[] => {
    const ordem = ultimaOrdem ?? [];
    return [...lista].sort((a, b) => {
        const idxA = ordem.indexOf(a.id);
        const idxB = ordem.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return a.nome.localeCompare(b.nome);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });
};

const diasOrdenados: DiaSemana[] = [0, 1, 2, 3, 4, 5, 6];

const EscalaEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { get, set } = useLocalStorage();
    const { getNewId } = useGenerateID();
    const theme = useTheme();

    const pessoas = get('pessoas');
    const funcoes = sortArray(get('funcoes'), { fieldToSort: 'nome' });
    const specialWeeks = get('specialWeeks');
    const scheduleConfigPadrao = get('scheduleConfig');
    const pdfConfig = get('pdfConfig');
    const funcoesOrdenadas = ordenarPorUltimaOrdem(funcoes, scheduleConfigPadrao.ultimaOrdemFuncoes);

    const escalaExistente = id ? get('schedules').find(s => s.id === Number(id)) : undefined;
    const naoEncontrada = !!id && !escalaExistente;

    const [schedule, setSchedule] = useState<Schedule | null>(escalaExistente ?? null);
    const [form, setForm] = useState({
        nome: '',
        dataInicio: '',
        quantidadeMeses: pdfConfig.quantidadeMeses,
        diasSemana: scheduleConfigPadrao.diasSemana,
        funcoesIds: funcoesOrdenadas.filter(f => f.status === Status.ATIVO).map(f => f.id),
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [gaps, setGaps] = useState<GenerationGap[]>([]);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const confirmPdfDialogState = useState(false);
    const excluirDialogState = useState(false);
    const regerarDialogState = useState(false);
    const [dragFuncaoId, setDragFuncaoId] = useState<number | null>(null);

    const toggleDiaForm = (dia: DiaSemana, checked: boolean) => {
        setForm(prev => ({
            ...prev,
            diasSemana: checked ? [...prev.diasSemana, dia] : prev.diasSemana.filter(d => d !== dia),
        }));
    };

    const toggleFuncaoForm = (funcaoId: number, checked: boolean) => {
        setForm(prev => ({
            ...prev,
            funcoesIds: checked ? [...prev.funcoesIds, funcaoId] : prev.funcoesIds.filter(f => f !== funcaoId),
        }));
    };

    const criarEscala = (autoPreencher: boolean) => {
        if (!form.nome || !form.dataInicio || !form.funcoesIds.length || !form.diasSemana.length) {
            setFormError('Preencha nome, data início, ao menos um dia da semana e ao menos uma função.');
            return;
        }

        const dataFim = addMonths(form.dataInicio, form.quantidadeMeses);
        const scheduleConfig = { diasSemana: form.diasSemana };
        const funcoesSelecionadas = form.funcoesIds
            .map(fid => funcoes.find(f => f.id === fid))
            .filter((f): f is Funcao => !!f);
        const slots = getFuncaoSlots(funcoesSelecionadas);
        const skeleton = buildScheduleDays(form.dataInicio, dataFim, scheduleConfig, specialWeeks, slots);
        const { dias, gaps: gapsGeracao } = autoPreencher
            ? autoFillSchedule(skeleton, pessoas, funcoes)
            : { dias: skeleton, gaps: [] };

        const novaEscala: Schedule = {
            id: getNewId('schedules'),
            nome: form.nome,
            dataInicio: form.dataInicio,
            dataFim,
            funcoesIds: form.funcoesIds,
            dias,
            scheduleConfig,
            status: ScheduleStatus.RASCUNHO,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
        };

        setSchedule(novaEscala);
        setGaps(gapsGeracao);
        setValidation(null);
        setFormError(null);
    };

    const preencherAutomaticamente = () => {
        if (!schedule) return;
        const { dias, gaps: novosGaps } = autoFillSchedule(schedule.dias, pessoas, funcoes);
        setSchedule({ ...schedule, dias });
        setGaps(novosGaps);
        setValidation(null);
    };

    const regerarEscala = () => {
        if (!schedule) return;
        const diasLimpos = schedule.dias.map(dia => dia.especial
            ? dia
            : { ...dia, atribuicoes: dia.atribuicoes.map(a => ({ ...a, pessoaId: null, manual: false })) }
        );
        const { dias, gaps: novosGaps } = autoFillSchedule(diasLimpos, pessoas, funcoes);
        setSchedule({ ...schedule, dias });
        setGaps(novosGaps);
        setValidation(null);
        regerarDialogState[1](false);
    };

    const validar = (): ValidationResult | null => {
        if (!schedule) return null;
        const result = validateSchedule(schedule, pessoas, funcoes);
        setValidation(result);
        return result;
    };

    const salvarEObter = (): Schedule | null => {
        if (!schedule) return null;
        const schedules = Array.from(get('schedules'));
        const atualizado: Schedule = { ...schedule, atualizadoEm: new Date().toISOString() };
        const indice = schedules.findIndex(s => s.id === schedule.id);
        if (indice === -1) {
            schedules.push(atualizado);
        } else {
            schedules[indice] = atualizado;
        }
        set('schedules', schedules);
        set('scheduleConfig', { ...get('scheduleConfig'), ultimaOrdemFuncoes: schedule.funcoesIds });
        setSchedule(atualizado);
        return atualizado;
    };

    const salvar = () => {
        if (salvarEObter()) {
            setFeedback('Escala salva com sucesso.');
        }
    };

    const abrirPdf = async () => {
        const atualizado = salvarEObter() ?? schedule;
        if (!atualizado) return;
        const blob = await generateSchedulePdfBlob(atualizado, pessoas, funcoes, pdfConfig);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    const gerarPdf = () => {
        const result = validar();
        if (!result || !result.valid) {
            setFeedback('Corrija os erros apontados pela validação antes de gerar o PDF.');
            return;
        }
        if (result.warnings.length) {
            confirmPdfDialogState[1](true);
            return;
        }
        abrirPdf();
    };

    const confirmarPdfComAvisos = () => {
        confirmPdfDialogState[1](false);
        abrirPdf();
    };

    const confirmPdfDialogProps: DialogProps = {
        state: confirmPdfDialogState,
        onClose: () => { },
        content: {
            header: 'Gerar PDF com avisos',
            body: <Typography>
                A escala possui {validation?.warnings.length ?? 0} aviso(s) que não impedem a geração, mas indicam pontos de atenção na distribuição. Deseja gerar o PDF mesmo assim?
            </Typography>,
            footer: <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <Button variant="contained" color="error" onClick={() => confirmPdfDialogState[1](false)}>Cancelar</Button>
                <Button variant="contained" color="success" onClick={confirmarPdfComAvisos}>Gerar mesmo assim</Button>
            </Box>
        }
    };

    const setCelula = (dayIndex: number, funcaoId: number, posicaoId: number | null, pessoaId: number | null) => {
        if (!schedule) return;
        const dias = schedule.dias.map((dia, index) => {
            if (index !== dayIndex) return dia;
            return {
                ...dia,
                atribuicoes: dia.atribuicoes.map(a => (a.funcaoId === funcaoId && (a.posicaoId ?? null) === posicaoId)
                    ? { ...a, pessoaId, manual: pessoaId !== null }
                    : a),
            };
        });
        setSchedule({ ...schedule, dias });
        setValidation(null);
    };

    const limparDia = (dayIndex: number) => {
        if (!schedule) return;
        const dias = schedule.dias.map((dia, index) => {
            if (index !== dayIndex) return dia;
            return {
                ...dia,
                atribuicoes: dia.atribuicoes.map(a => ({ ...a, pessoaId: null, manual: false })),
            };
        });
        setSchedule({ ...schedule, dias });
        setValidation(null);
    };

    const excluirEscala = () => {
        if (!schedule) return;
        const schedules = get('schedules').filter(s => s.id !== schedule.id);
        set('schedules', schedules);
        excluirDialogState[1](false);
        navigate('/escalas');
    };

    const excluirDialogProps: DialogProps = {
        state: excluirDialogState,
        onClose: () => { },
        content: {
            header: 'Excluir escala',
            body: <Typography>
                Tem certeza que deseja excluir a escala "{schedule?.nome}"? Essa ação não pode ser desfeita.
            </Typography>,
            footer: <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <Button variant="contained" color="secondary" onClick={() => excluirDialogState[1](false)}>Cancelar</Button>
                <Button variant="contained" color="error" onClick={excluirEscala}>Excluir</Button>
            </Box>
        }
    };

    const regerarDialogProps: DialogProps = {
        state: regerarDialogState,
        onClose: () => { },
        content: {
            header: 'Re-gerar escala',
            body: <Typography>
                Isso vai apagar todas as atribuições atuais (inclusive as feitas manualmente) e gerar a escala inteira do zero. Essa ação não pode ser desfeita. Deseja continuar?
            </Typography>,
            footer: <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <Button variant="contained" color="secondary" onClick={() => regerarDialogState[1](false)}>Cancelar</Button>
                <Button variant="contained" color="error" onClick={regerarEscala}>Re-gerar</Button>
            </Box>
        }
    };

    const pessoasElegiveis = (dayIndex: number, funcaoId: number, pessoaIdAtual: number | null) => {
        if (!schedule) return [];
        const dia = schedule.dias[dayIndex];
        return pessoas.filter(p =>
            p.status === Status.ATIVO &&
            p.funcoes.some(f => f.id === funcaoId) &&
            (p.id === pessoaIdAtual || !dia.atribuicoes.some(a => a.pessoaId === p.id))
        );
    };

    const criarFa: FloatingActions = [
        {
            id: 'criar-manual',
            icon: 'fa-solid fa-pen',
            label: 'Criar manualmente',
            onClick: () => criarEscala(false),
        },
        {
            id: 'gerar-automatico',
            icon: 'fa-solid fa-wand-magic-sparkles',
            label: 'Gerar automaticamente',
            onClick: () => criarEscala(true),
        },
    ];

    const editorFa: FloatingActions = [
        {
            id: 'preencher-automaticamente',
            icon: 'fa-solid fa-wand-magic-sparkles',
            label: 'Preencher automaticamente',
            onClick: preencherAutomaticamente,
        },
        {
            id: 'regerar-escala',
            icon: 'fa-solid fa-rotate',
            label: 'Re-gerar escala',
            onClick: () => regerarDialogState[1](true),
        },
        {
            id: 'validar',
            icon: 'fa-solid fa-check-double',
            label: 'Validar escala',
            onClick: validar,
        },
        {
            id: 'gerar-pdf',
            icon: 'fa-solid fa-file-pdf',
            label: 'Gerar PDF',
            onClick: gerarPdf,
        },
        {
            id: 'salvar',
            icon: 'fa-solid fa-floppy-disk',
            label: 'Salvar',
            onClick: salvar,
        },
        {
            id: 'excluir',
            icon: 'fa-solid fa-trash-can',
            label: 'Excluir escala',
            onClick: () => excluirDialogState[1](true),
        },
    ];

    if (naoEncontrada) {
        return (
            <Box>
                <Alert severity="error">Escala não encontrada.</Alert>
                <Button sx={{ mt: '20px' }} variant="contained" onClick={() => navigate('/escalas')}>Voltar para escalas</Button>
            </Box>
        );
    }

    if (!schedule) {
        return (
            <Paper sx={{ padding: '20px' }}>
                <Typography variant="h6" sx={{ mb: '20px' }}>Nova escala</Typography>

                {formError && <Alert severity="error" sx={{ mb: '20px' }}>{formError}</Alert>}

                <Grid container spacing={2} sx={{ mb: '20px' }}>
                    <Grid size={6}>
                        <TextField
                            autoFocus
                            color="secondary"
                            fullWidth
                            label="Nome da escala *"
                            variant="standard"
                            value={form.nome}
                            onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                        />
                    </Grid>
                    <Grid size={3}>
                        <DateFieldBR
                            required
                            label="Data início"
                            value={form.dataInicio}
                            onChange={iso => setForm(prev => ({ ...prev, dataInicio: iso }))}
                        />
                    </Grid>
                    <Grid size={3}>
                        <TextField
                            color="secondary"
                            fullWidth
                            type="number"
                            label="Quantidade de meses"
                            variant="standard"
                            inputProps={{ min: 1 }}
                            value={form.quantidadeMeses}
                            onChange={e => setForm(prev => ({ ...prev, quantidadeMeses: Math.max(1, Number(e.target.value)) }))}
                        />
                    </Grid>
                </Grid>

                <Typography variant="subtitle1" sx={{ mb: '10px' }}>Dias da semana</Typography>
                <Grid container spacing={1} sx={{ mb: '20px' }}>
                    {diasOrdenados.map(dia => (
                        <Grid size={4} key={dia}>
                            <FormControlLabel
                                control={<Checkbox
                                    color="secondary"
                                    checked={form.diasSemana.includes(dia)}
                                    onChange={(_, checked) => toggleDiaForm(dia, checked)}
                                />}
                                label={diasSemanaLabel[dia]}
                            />
                        </Grid>
                    ))}
                </Grid>

                <Typography variant="subtitle1" sx={{ mb: '10px' }}>Funções utilizadas nesta escala</Typography>
                <Grid container spacing={1} sx={{ mb: '20px' }}>
                    {funcoesOrdenadas.filter(f => f.status === Status.ATIVO).map(funcao => (
                        <Grid size={4} key={funcao.id}>
                            <FormControlLabel
                                control={<Checkbox
                                    color="secondary"
                                    checked={form.funcoesIds.includes(funcao.id)}
                                    onChange={(_, checked) => toggleFuncaoForm(funcao.id, checked)}
                                />}
                                label={funcao.posicoes?.length ? `${funcao.nome} (${funcao.posicoes.length}x)` : funcao.nome}
                            />
                        </Grid>
                    ))}
                </Grid>

                <FloatingActionsComponent floatingActions={criarFa} />
            </Paper>
        );
    }

    const funcoesDaEscala = schedule.funcoesIds
        .map(fid => funcoes.find(f => f.id === fid))
        .filter((f): f is NonNullable<typeof f> => !!f);
    const slots = getFuncaoSlots(funcoesDaEscala);

    const slotLabel = (funcaoId: number, posicaoId: number | null): string => {
        const funcao = funcoes.find(f => f.id === funcaoId);
        if (!funcao) return '';
        if (posicaoId === null) return funcao.nome;
        const posicao = (funcao.posicoes ?? []).find(p => p.id === posicaoId);
        return posicao && posicao.nome ? `${funcao.nome} - ${posicao.nome}` : funcao.nome;
    };

    const moverColuna = (funcaoOrigemId: number, funcaoDestinoId: number) => {
        if (!schedule || funcaoOrigemId === funcaoDestinoId) return;
        const ids = [...schedule.funcoesIds];
        const indiceOrigem = ids.indexOf(funcaoOrigemId);
        const indiceDestino = ids.indexOf(funcaoDestinoId);
        if (indiceOrigem === -1 || indiceDestino === -1) return;
        ids.splice(indiceOrigem, 1);
        ids.splice(indiceDestino, 0, funcaoOrigemId);
        setSchedule({ ...schedule, funcoesIds: ids });
    };

    const linhas = buildDisplayRows(schedule.dias);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Paper sx={{ padding: '10px 20px' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={6}>
                        <TextField
                            color="secondary"
                            fullWidth
                            label="Nome da escala"
                            variant="standard"
                            value={schedule.nome}
                            onChange={e => setSchedule({ ...schedule, nome: e.target.value })}
                        />
                    </Grid>
                    <Grid size={6}>
                        <Typography variant="body2">
                            Período: {formatDateBR(schedule.dataInicio)} a {formatDateBR(schedule.dataFim)} — Status: {schedule.status === ScheduleStatus.FINALIZADA ? 'Finalizada' : 'Rascunho'}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {!!gaps.length && (
                <Alert severity="warning">
                    Não foi possível preencher {gaps.length} atribuição(ões) automaticamente:
                    <ul>
                        {gaps.map((gap, index) => (
                            <li key={index}>{formatDateBR(gap.data)} — {gap.motivo}</li>
                        ))}
                    </ul>
                </Alert>
            )}

            {validation && (
                validation.valid
                    ? <Alert severity="success">Escala válida{validation.warnings.length ? ` — ${validation.warnings.length} aviso(s)` : ''}. Todas as regras obrigatórias foram atendidas.</Alert>
                    : <Alert severity="error">
                        Escala possui problemas — {validation.errors.length} erro(s) encontrado(s):
                        <ul>
                            {validation.errors.map((erro, index) => (
                                <li key={index}>{erro.message}</li>
                            ))}
                        </ul>
                    </Alert>
            )}

            {validation && !!validation.warnings.length && (
                <Alert severity="warning">
                    {validation.warnings.length} aviso(s):
                    <ul>
                        {validation.warnings.map((aviso, index) => (
                            <li key={index}>{aviso.message}</li>
                        ))}
                    </ul>
                </Alert>
            )}

            {feedback && <Alert severity="info" onClose={() => setFeedback(null)}>{feedback}</Alert>}

            <CustomDialog {...confirmPdfDialogProps} />
            <CustomDialog {...excluirDialogProps} />
            <CustomDialog {...regerarDialogProps} />
            <FloatingActionsComponent floatingActions={editorFa} />

            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 230px)' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: '100px' }}>Data</TableCell>
                            {slots.map((slot, index) => (
                                <TableCell
                                    key={index}
                                    draggable
                                    onDragStart={() => setDragFuncaoId(slot.funcaoId)}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={() => {
                                        if (dragFuncaoId !== null) moverColuna(dragFuncaoId, slot.funcaoId);
                                        setDragFuncaoId(null);
                                    }}
                                    sx={{ cursor: 'grab' }}
                                >
                                    <Tooltip title="Arraste para reordenar" arrow>
                                        <span>{slotLabel(slot.funcaoId, slot.posicaoId)}</span>
                                    </Tooltip>
                                </TableCell>
                            ))}
                            <TableCell sx={{ width: '0' }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {linhas.map(linha => (
                            linha.tipo === 'especial' ? (
                                <TableRow key={`especial-${linha.dataInicio}`}>
                                    <TableCell colSpan={slots.length + 2} align="center" sx={{ backgroundColor: theme.palette.action.selected, fontWeight: 700 }}>
                                        SEMANA ESPECIAL — {linha.nome} ({linha.dataInicio === linha.dataFim ? formatDateBR(linha.dataInicio) : `${formatDateBR(linha.dataInicio)} a ${formatDateBR(linha.dataFim)}`})
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <TableRow key={linha.dia.data}>
                                    <TableCell>{formatDateBR(linha.dia.data)}</TableCell>
                                    {slots.map((slot, index) => {
                                        const atribuicao = linha.dia.atribuicoes.find(a => a.funcaoId === slot.funcaoId && (a.posicaoId ?? null) === slot.posicaoId);
                                        const pessoaIdAtual = atribuicao?.pessoaId ?? null;
                                        const elegiveis = pessoasElegiveis(linha.index, slot.funcaoId, pessoaIdAtual);
                                        return (
                                            <TableCell key={index}>
                                                <Select
                                                    size="small"
                                                    fullWidth
                                                    displayEmpty
                                                    value={pessoaIdAtual ?? ''}
                                                    onChange={e => setCelula(linha.index, slot.funcaoId, slot.posicaoId, e.target.value === '' ? null : Number(e.target.value))}
                                                >
                                                    <MenuItem value=""><em>— vazio —</em></MenuItem>
                                                    {elegiveis.map(p => (
                                                        <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
                                                    ))}
                                                </Select>
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell sx={{ width: '0' }}>
                                        <Tooltip title="Limpar dia" arrow>
                                            <div style={{ width: 'fit-content' }}>
                                                <CustomIcon
                                                    icon="fa-solid fa-eraser"
                                                    color={theme.palette.error.main}
                                                    onClick={() => limparDia(linha.index)}
                                                />
                                            </div>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            )
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default EscalaEditor;
