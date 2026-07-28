import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout';
import { HomeComponent } from './features/landing/pages/home/home';
import { AdminDashboard } from './features/admin/pages/dashboard/dashboard';
import { StockComponent } from './features/admin/pages/stock/stock';
import { CategoriesComponent } from './features/admin/pages/categories/categories';
import { OrdersComponent } from './features/admin/pages/orders/orders';
import { AdminUsersComponent } from './features/admin/pages/users/users';
import { AdminReportesComponent } from './features/admin/pages/reportes/reportes';
import { AdminMetodosEntregaComponent } from './features/admin/pages/metodos-entrega/metodos-entrega';
import { LoginComponent } from './features/auth/pages/login/login';
import { RegisterComponent } from './features/auth/pages/register/register';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { customerGuard } from './core/guards/customer.guard';
import { distributorGuard } from './core/guards/distributor.guard';
import { homeRedirectGuard } from './core/guards/home-redirect.guard';
import { CatalogoComponent } from './features/cliente/pages/catalogo/catalogo';
import { CarritoComponent } from './features/cliente/pages/carrito/carrito';
import { ConfirmarComponent } from './features/cliente/pages/confirmar/confirmar';
import { MisPedidosComponent } from './features/cliente/pages/mis-pedidos/mis-pedidos';
import { PedidoDetalleClienteComponent } from './features/cliente/pages/pedido-detalle/pedido-detalle';
import { DistribuidorDashboardComponent } from './features/distribuidor/pages/dashboard/dashboard';
import { DistribuidorPedidosComponent } from './features/distribuidor/pages/pedidos/pedidos';
import { DistribuidorPedidoDetalleComponent } from './features/distribuidor/pages/pedido-detalle/pedido-detalle';
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
          { path: 'carrito', component: CarritoComponent },
          { path: 'confirmar', component: ConfirmarComponent },
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
        ],
      },
    ],
  },
  {
    path: 'admin',
    component: AdminDashboard,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'stock', pathMatch: 'full' },
      { path: 'stock', component: StockComponent },
      { path: 'categorias', component: CategoriesComponent },
      { path: 'ordenes', component: OrdersComponent },
      { path: 'metodos-entrega', component: AdminMetodosEntregaComponent },
      { path: 'usuarios', component: AdminUsersComponent },
      { path: 'reportes', component: AdminReportesComponent },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
