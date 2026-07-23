import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/dashboard/Dashboard";
import Jogadores from "../pages/jogadores/Jogadores";
import Pelada from "../pages/pelada/Pelada";
import Historico from "../pages/historico/Historico";
import Ranking from "../pages/ranking/Ranking";
import Configuracoes from "../pages/configuracoes/Configuracoes";

export default function AppRoutes() {

    return (

        <Routes>

            <Route element={<MainLayout />}>

                <Route index element={<Dashboard />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/jogadores" element={<Jogadores />} />

                <Route path="/pelada" element={<Pelada />} />

                <Route path="/historico" element={<Historico />} />

                <Route path="/ranking" element={<Ranking />} />

                <Route path="/configuracoes" element={<Configuracoes />} />

            </Route>

            <Route path="*" element={<Navigate to="/" />} />

        </Routes>

    );

}