import { useState } from "react";
import { OrdersTable } from "./OrderExport/OrderExport";
import { OrdersImport, type Order } from "./OrdersImport/OrdersImport";


export const DispozitiveIstyle = () => {

    const [orders, setOrders] = useState<Order[]>([]);

    return (
        <div className="w-full h-full grid grid-rows-[60px_1fr] gap-2 overflow-hidden">
            <OrdersImport setOrders={setOrders} />
            <OrdersTable orders={orders} />
        </div>
    )
}