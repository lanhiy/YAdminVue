import type { RouteRecordStringComponent } from '@vben/types';

const PRODUCT_PATH_RE = /(?:^|\/)product\/?$/;
const PDF_PREVIEW_PATH_RE = /(?:^|\/)pdf-preview\/?$/;

function isProductRoute(route: RouteRecordStringComponent) {
  const name = String(route.name ?? '');
  return PRODUCT_PATH_RE.test(route.path || '') || name === 'Product';
}

function isPdfPreviewRoute(route: RouteRecordStringComponent) {
  const name = String(route.name ?? '');
  return (
    PDF_PREVIEW_PATH_RE.test(route.path || '') ||
    name === 'SystemBusinessPdfPreview'
  );
}

function buildPdfPreviewRoute(
  product: RouteRecordStringComponent,
): RouteRecordStringComponent {
  const productPath = product.path || '/system/business/product';
  const path = productPath.replace(/product\/?$/, 'pdf-preview');
  const component = String(
    product.component || '/views/system/business/product/index',
  ).replace(/product\/index/, 'pdf-preview/index');

  return {
    name: 'SystemBusinessPdfPreview',
    path,
    component: component.includes('pdf-preview')
      ? component
      : '/views/system/business/pdf-preview/index',
    meta: {
      icon: 'mdi:file-pdf-box',
      order: (product.meta?.order ?? 0) + 1,
      title: 'PDF预览页面',
    },
  };
}

/** 将 PDF 预览页插入为产品菜单的同级节点（若后端尚未登记） */
export function injectPdfPreviewSibling(
  routes: RouteRecordStringComponent[],
): RouteRecordStringComponent[] {
  const walk = (nodes: RouteRecordStringComponent[]): boolean => {
    for (const node of nodes) {
      const children = node.children;
      if (!children?.length) continue;

      const product = children.find((child) => isProductRoute(child));
      if (product) {
        if (!children.some((child) => isPdfPreviewRoute(child))) {
          children.splice(
            children.indexOf(product) + 1,
            0,
            buildPdfPreviewRoute(product),
          );
        }
        return true;
      }

      if (walk(children)) return true;
    }
    return false;
  };

  if (walk(routes)) return routes;

  const product = routes.find((route) => isProductRoute(route));
  if (product && !routes.some((route) => isPdfPreviewRoute(route))) {
    routes.splice(routes.indexOf(product) + 1, 0, buildPdfPreviewRoute(product));
  }

  return routes;
}
