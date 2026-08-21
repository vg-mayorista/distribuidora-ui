import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout';
import { HomeComponent } from './features/landing/pages/home/home';
import { StockComponent } from './features/admin/pages/stock/stock';
import { CategoriesComponent } from './features/admin/pages/categories/categories';
import { OrdersComponent } from './features/admin/pages/orders/orders';
import { AdminUsersComponent } from './features/admin/pages/users/users';
import { AdminReportesComponent } from './features/admin/pages/reportes/reportes';
import { AdminMetodosEntregaComponent } from './features/admin/pages/metodos-entrega/metodos-entrega';
import { AdminDeliveryWindowsComponent } from './features/admin/pages/delivery-windows/delivery-windows';
import { RemitosComponent } from './features/descargar-remitos/pages/remitos/remitos';
import { RemitoDetalleComponent } from './features/descargar-remitos/pages/remito-detalle/remito-detalle';
import { RemitoTransicionComponent } from './features/descargar-remitos/pages/remito-transicion/remito-transicion';
import { LoginComponent } from './features/auth/pages/login/login';
import { RegisterComponent } from './features/auth/pages/register/register';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { customerGuard } from './core/guards/customer.guard';
import { distributorGuard } from './core/guards/distributor.guard';
import { homeRedirectGuard } from './core/guards/home-redirect.guard';
import { CatalogoComponent } from './features/cliente/pages/catalogo/catalogo';
import { CarritoComponent } from './features/cliente/pages/carrito/carrito';
import { CarritoStockComponent } from './features/cliente/pages/carrito-stock/carrito-stock';
import { StockDisponibleComponent } from './features/cliente/pages/stock-disponible/stock-disponible';
import { ConfirmarComponent } from './features/cliente/pages/confirmar/confirmar';
import { MisPedidosComponent } from './features/cliente/pages/mis-pedidos/mis-pedidos';
import { PedidoDetalleClienteComponent } from './features/cliente/pages/pedido-detalle/pedido-detalle';
import { DistribuidorDashboardComponent } from './features/distribuidor/pages/dashboard/dashboard';
import { DistribuidorPedidosComponent } from './features/distribuidor/pages/pedidos/pedidos';
import { DistribuidorPedidoDetalleComponent } from './features/distribuidor/pages/pedido-detalle/pedido-detalle';
import { DueñoReportesComponent } from './features/distribuidor/pages/reportes/reportes';
import { NotFoundComponent } from './features/not-found/not-found';
import { UnderConstructionComponent } from './features/under-construction/under-construction';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent, canActivate: [homeRedirectGuard] },
      { path: 'sobre-nosotros', component: UnderConstructionComponent },
      { path: 'contacto', component: UnderConstructionComponent },
      // `/productos` queda como alias del catálogo (requiere login de cliente)
      { path: 'productos', canActivate: [customerGuard], component: CatalogoComponent },
      {
        path: 'cliente',
        canActivate: [customerGuard],
        children: [
          { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
          { path: 'catalogo', component: CatalogoComponent },
          { path: 'stock-disponible', component: StockDisponibleComponent },
          { path: 'carrito', component: CarritoComponent },
          { path: 'carrito-stock', component: CarritoStockComponent },
          { path: 'confirmar', component: ConfirmarComponent },
          { path: 'confirmar-stock', component: ConfirmarComponent, data: { mode: 'stock' } },
          { path: 'mis-pedidos', component: MisPedidosComponent },
          { path: 'mis-pedidos/:id', component: PedidoDetalleClienteComponent },
        ],
      },
      {
        path: 'distribuidor',
        canActivate: [distributorGuard],
        children: [
          { path: '', component: DistribuidorDashboardComponent },
          { path: 'pedidos', component: DistribuidorPedidosComponent },
          { path: 'pedidos/:id', component: DistribuidorPedidoDetalleComponent },
          { path: 'stock', component: StockComponent },
          { path: 'categorias', component: CategoriesComponent },
          { path: 'metodos-entrega', component: AdminMetodosEntregaComponent },
          { path: 'reportes', component: DueñoReportesComponent },
          { path: 'remitos', component: RemitosComponent },
          { path: 'remitos/:id', component: RemitoDetalleComponent },
          { path: 'remitos/:id/transicion', component: RemitoTransicionComponent },
        ],
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
          { path: 'usuarios', component: AdminUsersComponent },
          { path: 'reportes', component: AdminReportesComponent },
          { path: 'delivery-windows', component: AdminDeliveryWindowsComponent },
          { path: 'remitos', component: RemitosComponent },
          { path: 'remitos/:id', component: RemitoDetalleComponent },
          { path: 'remitos/:id/transicion', component: RemitoTransicionComponent },
        ],
      },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
