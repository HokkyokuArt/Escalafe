import { Box, Button, FormControl, FormGroup, TextField, useTheme } from "@mui/material";
import { useState } from "react";
import CustomDialog, { DialogProps } from "../components/CustomDialog";
import DateFieldBR from "../components/DateFieldBR";
import FloatingActionsComponent, { FloatingActions } from "../components/FloatingActions";
import TableCustom, { ConfigCustomTable, OptionsRow } from "../components/TableCustom";
import useGenerateID from "../hooks/useGenerateID";
import useLocalStorage from "../hooks/useLocalStorage";
import { SpecialWeek } from "../models/SpecialWeek.model";
import { formatDateBR } from "../services/schedule/dateUtils";

const SemanasEspeciais = () => {
    const dialogUseState = useState(false);
    const [_, setDialogState] = dialogUseState;
    const [novaSemana, setNovaSemana] = useState<null | Partial<SpecialWeek>>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [formError, setFormError] = useState<{ nome: boolean; dataInicio: boolean; dataFim: boolean; }>({ nome: false, dataInicio: false, dataFim: false });
    const [shouldUpdateRows, setShouldUpdateRows] = useState(false);
    const { get, set } = useLocalStorage();
    const { getNewId } = useGenerateID();
    const theme = useTheme();

    const setDialogOpen = (open: boolean) => {
        setDialogState(open);
    };

    const resetSemana = () => {
        setFormError({ nome: false, dataInicio: false, dataFim: false });
        setNovaSemana(null);
    };

    const addNovaSemana = () => {
        setNovaSemana({ id: getNewId('specialWeeks'), nome: '', dataInicio: '', dataFim: '' });
    };

    const saveSemana = () => {
        const errors = {
            nome: !novaSemana?.nome,
            dataInicio: !novaSemana?.dataInicio,
            dataFim: !novaSemana?.dataFim || (!!novaSemana?.dataInicio && novaSemana.dataFim < novaSemana.dataInicio),
        };

        if (errors.nome || errors.dataInicio || errors.dataFim) {
            setFormError(errors);
            return;
        }

        const semanas = Array.from(get('specialWeeks'));
        if (!editing) {
            semanas.push(novaSemana as SpecialWeek);
        } else {
            const foundIndex = semanas.findIndex(s => s.id === novaSemana!.id);
            if (foundIndex !== -1) {
                semanas[foundIndex] = novaSemana as SpecialWeek;
            }
        }
        set('specialWeeks', semanas);
        resetSemana();
        setDialogOpen(false);
        setShouldUpdateRows(true);
    };

    const config: ConfigCustomTable[] = [
        { key: 'nome', label: 'Nome' },
        { key: 'dataInicio', label: 'Início', convertFn: data => formatDateBR(data.dataInicio) },
        { key: 'dataFim', label: 'Fim', convertFn: data => formatDateBR(data.dataFim) },
    ];

    const fa: FloatingActions = [
        {
            id: 'novo',
            icon: 'fa-solid fa-plus',
            label: 'Novo',
            onClick: () => {
                setEditing(false);
                setDialogOpen(true);
                addNovaSemana();
            }
        }
    ];

    const dialogNovoProps: DialogProps = {
        state: dialogUseState,
        onClose: () => { resetSemana(); },
        content: {
            header: "Semana especial",
            body: <Box>
                <FormGroup>
                    <FormControl error={formError.nome}>
                        <TextField
                            autoFocus
                            color="secondary"
                            fullWidth
                            label="Nome *"
                            variant="standard"
                            error={formError.nome}
                            sx={{ mb: '20px' }}
                            value={novaSemana?.nome ?? ''}
                            onChange={event => {
                                const value = event.target.value?.toUpperCase();
                                setNovaSemana(prev => ({ ...prev, nome: value }));
                            }}
                        />
                    </FormControl>

                    <FormControl error={formError.dataInicio} sx={{ mb: '20px' }}>
                        <DateFieldBR
                            required
                            label="Data início"
                            error={formError.dataInicio}
                            value={novaSemana?.dataInicio ?? ''}
                            onChange={iso => setNovaSemana(prev => ({ ...prev, dataInicio: iso }))}
                        />
                    </FormControl>

                    <FormControl error={formError.dataFim} sx={{ mb: '20px' }}>
                        <DateFieldBR
                            required
                            label="Data fim"
                            error={formError.dataFim}
                            value={novaSemana?.dataFim ?? ''}
                            onChange={iso => setNovaSemana(prev => ({ ...prev, dataFim: iso }))}
                        />
                    </FormControl>
                </FormGroup>
            </Box>,
            footer: <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <Button variant="contained" color="error" onClick={() => { resetSemana(); setDialogOpen(false); }}>
                    Cancelar
                </Button>
                <Button variant="contained" color="success" onClick={saveSemana}>Salvar</Button>
            </Box>
        }
    };

    const optionsRow: OptionsRow[] = [
        {
            id: 'editar',
            icon: () => 'fa-solid fa-pencil',
            color: () => theme.palette.info.main,
            label: () => 'Editar',
            onClick: row => {
                setEditing(true);
                setDialogOpen(true);
                setNovaSemana(row);
            }
        },
        {
            id: 'excluir',
            icon: () => 'fa-solid fa-trash-can',
            color: () => theme.palette.error.main,
            label: () => 'Excluir',
            onClick: row => {
                const semanas = get('specialWeeks');
                const filtradas = semanas.filter(s => s.id !== row.id);
                set('specialWeeks', filtradas);
                setShouldUpdateRows(true);
            }
        },
    ];

    return (
        <>
            <TableCustom
                localStorageKey='specialWeeks'
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

export default SemanasEspeciais;
