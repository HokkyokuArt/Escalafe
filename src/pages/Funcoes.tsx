import { Autocomplete, Box, Button, Checkbox, Chip, FormControl, FormControlLabel, FormGroup, TextField, Typography, useTheme } from "@mui/material";
import Grid from '@mui/material/Grid2';
import { useState } from "react";
import CustomDialog, { DialogProps } from "../components/CustomDialog";
import CustomIcon from "../components/CustomIcon";
import FloatingActionsComponent, { FloatingActions } from "../components/FloatingActions";
import TableCustom, { ConfigCustomTable, OptionsRow } from "../components/TableCustom";
import { Status } from "../enum/Status";
import useGenerateID from "../hooks/useGenerateID";
import useLocalStorage from "../hooks/useLocalStorage";
import { Funcao, Posicao } from "../models/Funcao.model";
import { Pessoa } from "../models/Pessoa.model";
import { hexToRgb, rgbToHex, sortArray } from "../utils/utils";

type FuncaoLocalState = null | Partial<Funcao> & { pessoas: Pessoa[]; };

const Funcoes = () => {
    const dialogUseState = useState(false);
    const [_, setDialogState] = dialogUseState;
    const [novaFuncao, setNovaFuncao] = useState<FuncaoLocalState>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [formError, setFormError] = useState<{ nome: boolean; }>({ nome: false });
    const [shouldUpdateRows, setShouldUpdateRows] = useState(false);
    const { get, set } = useLocalStorage();
    const { getNewId } = useGenerateID();
    const theme = useTheme();
    const pessoaOptions = sortArray(get('pessoas'), { fieldToSort: 'nome' });
    const pdfConfigAtual = get('pdfConfig');

    const setDialogOpen = (open: boolean) => {
        setDialogState(open);
    };

    const toggleCorCustomizada = (ativar: boolean) => {
        setNovaFuncao(prev => ({
            ...prev,
            pessoas: prev?.pessoas ?? [],
            corPar: ativar ? (prev?.corPar ?? pdfConfigAtual.corLinhaPar ?? { r: 255, g: 255, b: 255 }) : undefined,
            corImpar: ativar ? (prev?.corImpar ?? pdfConfigAtual.corLinhaImpar ?? { r: 210, g: 225, b: 245 }) : undefined,
            corFonte: ativar ? (prev?.corFonte ?? pdfConfigAtual.corFonte ?? { r: 0, g: 0, b: 0 }) : undefined,
        }));
    };

    const addNovaFuncao = () => {
        setNovaFuncao({ id: getNewId('funcoes'), nome: '', status: Status.ATIVO, posicoes: [], pessoas: [] });
    };

    const resetFuncao = () => {
        setFormError({ nome: false });
        setNovaFuncao(null);
    };

    const addPosicao = () => {
        setNovaFuncao(prev => {
            const posicoes = prev?.posicoes ?? [];
            const proximoId = 1 + posicoes.reduce((max, p) => Math.max(max, p.id), 0);
            return { ...prev, pessoas: prev?.pessoas ?? [], posicoes: [...posicoes, { id: proximoId, nome: '' }] };
        });
    };

    const updatePosicaoNome = (index: number, nome: string) => {
        setNovaFuncao(prev => {
            const posicoes = (prev?.posicoes ?? []).slice();
            posicoes[index] = { ...posicoes[index], nome };
            return { ...prev, pessoas: prev?.pessoas ?? [], posicoes };
        });
    };

    const removePosicao = (index: number) => {
        setNovaFuncao(prev => ({
            ...prev,
            pessoas: prev?.pessoas ?? [],
            posicoes: (prev?.posicoes ?? []).filter((_, i) => i !== index),
        }));
    };

    const saveFuncao = () => {
        if (!novaFuncao?.nome) {
            setFormError({ nome: true });
            return;
        }

        const funcoes = Array.from(get('funcoes'));
        if ((!editing && funcoes.find(p => p.nome === novaFuncao.nome))
            || (!!funcoes.find(p => p.nome === novaFuncao.nome && p.id != novaFuncao.id))
        ) {
            setFormError({ nome: true });
            return;
        }

        const { pessoas, ...funcao } = novaFuncao;

        if (!editing) {
            funcoes.push(funcao as Funcao);
        } else {
            const foundIndex = funcoes.findIndex(p => p.id === funcao.id);
            if (foundIndex !== -1) {
                funcoes[foundIndex] = funcao as Funcao;
            }
        }
        set('funcoes', funcoes);
        setFuncaoInPessoas();
        resetFuncao();
        setDialogOpen(false);
        setShouldUpdateRows(true);
    };

    const setFuncaoInPessoas = () => {
        const { pessoas, ...funcao } = novaFuncao!;
        pessoaOptions.forEach(opt => {
            const found = pessoas.find(p => p.id === opt.id);
            if (found) {
                opt.funcoes.push(funcao as Funcao);
            } else {
                opt.funcoes = opt.funcoes.filter(f => f.id !== funcao.id);
            }
        });

        set('pessoas', pessoaOptions);
    };

    const config: ConfigCustomTable[] = [
        {
            key: 'nome',
            label: 'Nome',
        },
        {
            key: 'posicoes',
            label: 'Pessoas por dia',
            convertFn: data => (data.posicoes?.length ? String(data.posicoes.length) : '1'),
        },
    ];

    const dialogNovoProps: DialogProps = {
        state: dialogUseState,
        onClose: () => {
            resetFuncao();
        },
        content: {
            header: "Adicionar função",
            body: <Box>
                <FormGroup>
                    <FormControl error={formError.nome}>
                        <TextField
                            autoFocus
                            color="secondary"
                            fullWidth
                            id="nome"
                            label="Nome *"
                            variant="standard"
                            error={formError.nome}
                            sx={{
                                mb: '20px'
                            }}
                            value={novaFuncao?.nome ?? ''}
                            onChange={event => {
                                const value = event.target.value?.toUpperCase();
                                setNovaFuncao(prev => ({
                                    ...prev,
                                    pessoas: prev?.pessoas ?? [],
                                    nome: value
                                }));
                            }}
                        />
                    </FormControl>

                    <FormControl>
                        <Autocomplete
                            multiple
                            disableCloseOnSelect
                            options={pessoaOptions}
                            fullWidth
                            value={novaFuncao?.pessoas ?? []}
                            onChange={(_, value) => {
                                setNovaFuncao(prev => ({
                                    ...prev,
                                    pessoas: value
                                }));
                            }}
                            getOptionLabel={(option) => option.nome}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    color="secondary"
                                    label="Pessoas"
                                    variant="standard"
                                    sx={{
                                        mb: '20px'
                                    }}
                                />
                            }
                            renderOption={(props, option, { selected }) => {
                                const { key, ...optionProps } = props;
                                return (
                                    <li key={option.id} {...optionProps}>
                                        <Checkbox
                                            style={{ marginRight: 8 }}
                                            checked={selected}
                                        />
                                        {option.nome}
                                    </li>
                                );
                            }}

                            renderTags={(value, getTagProps) =>
                                value.map((option, index: number) => {
                                    const tagProps = getTagProps({ index });
                                    return (
                                        <Chip
                                            {...tagProps}
                                            label={option.nome}
                                            key={option.id}
                                            color="primary"
                                        />
                                    );
                                })
                            }

                        />
                    </FormControl>

                    <FormControl sx={{ mt: '10px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '10px' }}>
                            <Typography variant="subtitle2">
                                Posições (quando a função precisa de mais de uma pessoa por dia)
                            </Typography>
                            <Button size="small" variant="outlined" color="secondary" onClick={addPosicao}>
                                Adicionar posição
                            </Button>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: '10px', display: 'block' }}>
                            Deixe o nome em branco se as posições não tiverem um local específico (ex: 2 microfones iguais). Dê um nome quando cada posição for um local diferente (ex: Entrada, Corredor).
                        </Typography>
                        {(novaFuncao?.posicoes ?? []).map((posicao: Posicao, index: number) => (
                            <Box key={posicao.id} sx={{ display: 'flex', gap: '10px', alignItems: 'center', mb: '10px' }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    color="secondary"
                                    variant="standard"
                                    label={`Nome da posição ${index + 1} (opcional)`}
                                    placeholder="Ex: Entrada"
                                    value={posicao.nome}
                                    onChange={e => updatePosicaoNome(index, e.target.value)}
                                />
                                <CustomIcon
                                    icon="fa-solid fa-trash-can"
                                    color={theme.palette.error.main}
                                    onClick={() => removePosicao(index)}
                                />
                            </Box>
                        ))}
                    </FormControl>

                    <FormControl sx={{ mt: '10px' }}>
                        <FormControlLabel
                            control={<Checkbox
                                color="secondary"
                                checked={!!novaFuncao?.corPar}
                                onChange={(_, checked) => toggleCorCustomizada(checked)}
                            />}
                            label="Personalizar cor desta função (sobrescreve as cores padrão de linha par/ímpar)"
                        />
                        {!!novaFuncao?.corPar && (
                            <Grid container spacing={2} sx={{ mt: '5px' }}>
                                <Grid size={6}>
                                    <Typography variant="body2">Cor linha par</Typography>
                                    <input
                                        type="color"
                                        value={rgbToHex(novaFuncao.corPar)}
                                        onChange={e => setNovaFuncao(prev => ({ ...prev, pessoas: prev?.pessoas ?? [], corPar: hexToRgb(e.target.value) }))}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <Typography variant="body2">Cor linha ímpar</Typography>
                                    <input
                                        type="color"
                                        value={rgbToHex(novaFuncao.corImpar ?? pdfConfigAtual.corLinhaImpar ?? { r: 210, g: 225, b: 245 })}
                                        onChange={e => setNovaFuncao(prev => ({ ...prev, pessoas: prev?.pessoas ?? [], corImpar: hexToRgb(e.target.value) }))}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <Typography variant="body2">Cor da fonte</Typography>
                                    <input
                                        type="color"
                                        value={rgbToHex(novaFuncao.corFonte ?? pdfConfigAtual.corFonte ?? { r: 0, g: 0, b: 0 })}
                                        onChange={e => setNovaFuncao(prev => ({ ...prev, pessoas: prev?.pessoas ?? [], corFonte: hexToRgb(e.target.value) }))}
                                    />
                                </Grid>
                            </Grid>
                        )}
                    </FormControl>

                    <FormControl sx={{ mt: '10px' }}>
                        <FormControlLabel
                            control={<Checkbox
                                color="secondary"
                                checked={!!novaFuncao?.designacaoSemana}
                                onChange={(_, checked) => setNovaFuncao(prev => ({ ...prev, pessoas: prev?.pessoas ?? [], designacaoSemana: checked }))}
                            />}
                            label="Designação semanal (a mesma pessoa cobre a função a semana toda)"
                        />
                        <FormControlLabel
                            control={<Checkbox
                                color="secondary"
                                checked={!!novaFuncao?.rotatividadeMaxima}
                                onChange={(_, checked) => setNovaFuncao(prev => ({ ...prev, pessoas: prev?.pessoas ?? [], rotatividadeMaxima: checked }))}
                            />}
                            label="Rotatividade máxima (só repete uma pessoa após todas as outras já terem participado)"
                        />
                    </FormControl>

                </FormGroup>
            </Box>,
            footer: <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '20px'
                }}>
                <Button variant="contained" color="error" onClick={() => { resetFuncao(); setDialogOpen(false); }}>
                    Cancelar
                </Button>
                <Button variant="contained" color="success" onClick={saveFuncao}>Salvar</Button>
            </Box>
        }
    };

    const optionsRow: OptionsRow[] = [
        {
            id: 'ativar-inativa',
            icon: row => {
                return row.status === Status.ATIVO
                    ? 'fa-solid fa-circle-check'
                    : 'fa-solid fa-circle-xmark';
            },
            color: row => {
                return row.status === Status.ATIVO
                    ? theme.palette.success.main
                    : theme.palette.error.main;
            },
            label: row => {
                return row.status === Status.ATIVO
                    ? 'Ativo'
                    : 'Intativo';
            },
            onClick: row => {
                const funcoes = get('funcoes');
                const found = funcoes.find(p => p.id === row.id);
                if (found) {
                    found.status = row.status === Status.ATIVO
                        ? Status.INATIVO
                        : Status.ATIVO;
                }

                set('funcoes', funcoes);
                setShouldUpdateRows(true);
            }
        },
        {
            id: 'editar',
            icon: () => 'fa-solid fa-pencil',
            color: () => theme.palette.info.main,
            label: () => 'Editar',
            onClick: row => {
                const toSet: FuncaoLocalState = {
                    ...row,
                    pessoas: pessoaOptions.filter(p => !!p.funcoes.find(f => f.id === row.id)),
                };
                setEditing(true);
                setDialogOpen(true);
                setNovaFuncao(toSet);
            }
        },
        {
            id: 'excluir',
            icon: () => 'fa-solid fa-trash-can',
            color: () => theme.palette.error.main,
            label: () => 'Excluir',
            onClick: row => {
                const funcoes = get('funcoes');
                const filteredFuncoes = funcoes.filter(p => p.id !== row.id);
                set('funcoes', filteredFuncoes);
                pessoaOptions.forEach(p => {
                    p.funcoes = p.funcoes.filter(f => f.id !== row.id);
                });
                set('pessoas', pessoaOptions);
                setShouldUpdateRows(true);
            }
        },
    ];

    const fa: FloatingActions = [
        {
            id: 'novo',
            icon: 'fa-solid fa-plus',
            label: 'Novo',
            onClick: () => {
                setEditing(false);
                setDialogOpen(true);
                addNovaFuncao();
            }
        }
    ];

    return (
        <>
            <TableCustom
                localStorageKey='funcoes'
                config={config}
                optionsRow={optionsRow}
                shouldUpdate={shouldUpdateRows}
                setShouldUpdate={setShouldUpdateRows}
            />
            <FloatingActionsComponent floatingActions={fa} />
            <CustomDialog {...dialogNovoProps} />
        </>
    );
};

export default Funcoes;
