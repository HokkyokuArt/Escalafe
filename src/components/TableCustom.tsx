import styled from '@emotion/styled';
import { Box, Tooltip } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import useLocalStorage, { LocalStorageStateKey } from '../hooks/useLocalStorage';
import { resolve, sortArray } from '../utils/utils';
import CustomIcon from './CustomIcon';

export type ConfigCustomTable = {
    key: string;
    label: string;
    width?: string;
    minWidth?: string;
    customTemplate?: (data: any, config: ConfigCustomTable) => React.ReactElement;
    convertFn?: (data: any, config: ConfigCustomTable) => string;
};

export type OptionsRow = {
    id: string;
    icon: (row: any) => string;
    label: (row: any) => string;
    color?: (row: any) => string;
    onClick: (row: any) => void;
};

type Props = {
    localStorageKey: LocalStorageStateKey;
    shouldUpdate: boolean;
    setShouldUpdate: Dispatch<SetStateAction<boolean>>;
    config: ConfigCustomTable[];
    optionsRow?: OptionsRow[];
};

const TableCustom = ({ config, localStorageKey, optionsRow, shouldUpdate, setShouldUpdate }: Props) => {
    const { get } = useLocalStorage();
    const getRows = () => {
        const rowsState = get(localStorageKey);
        return sortArray(rowsState, { fieldToSort: 'nome' });
    };

    const [rows, setRows] = useState(getRows());
    const options = optionsRow ?? [];

    useEffect(() => {
        if (shouldUpdate) {
            setRows(getRows());
            setShouldUpdate(false);
        }
    }, [shouldUpdate]);

    return (
        <TableContainer component={Paper} sx={{ height: '80vh' }}>
            <Table sx={{ minWidth: 650 }} stickyHeader >
                <TableHead>
                    <StyledTableRow>
                        {config.map(c => (
                            <TableCell
                                key={`${c.key}-header`}
                                sx={{
                                    width: c.width,
                                    minWidth: c.minWidth,
                                }}
                            >
                                {c.label}
                            </TableCell>
                        ))}

                        {!!options.length && <TableCell sx={{ width: '0' }} />}
                    </StyledTableRow>
                </TableHead>
                <TableBody>
                    {!!rows.length && rows.map((row, indexRow) => (
                        <StyledTableRow
                            key={indexRow}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >

                            {config.map(c => (
                                <TableCell
                                    key={`${c.key}-${indexRow}-item`}
                                    sx={{
                                        width: c.width,
                                        minWidth: c.minWidth,
                                    }}
                                >
                                    {!!c.customTemplate && c.customTemplate(row, c)}
                                    {!c.customTemplate && resolve(row, c.key)?.toString().toUpperCase()}
                                </TableCell>
                            ))}


                            {!!options.length && (
                                <TableCell
                                    sx={{ width: 'min-content', }}
                                >
                                    <Box sx={{ display: 'flex', gap: '10px' }}>
                                        {options.map(opt => {
                                            return (
                                                <Tooltip key={opt.id} title={opt.label(row)} arrow>
                                                    <div style={{ width: 'fit-content' }}>
                                                        <CustomIcon icon={opt.icon(row)} color={opt.color?.(row)} onClick={() => opt.onClick(row)}></CustomIcon>
                                                    </div>
                                                </Tooltip>
                                            );
                                        })}
                                    </Box>
                                </TableCell>
                            )}
                        </StyledTableRow>
                    ))}

                    {!rows.length && (
                        <StyledTableRow
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="td" scope="row" colSpan={999}>
                                Nenhum resultado encontrado
                            </TableCell>

                        </StyledTableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TableCustom;

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: (theme as any).palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));
