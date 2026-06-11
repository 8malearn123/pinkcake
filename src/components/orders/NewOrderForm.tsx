import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBranches } from '@/hooks/useBranches';
import { useProducts } from '@/hooks/useProducts';
import { useCreateOrder, CreateOrderData } from '@/hooks/useOrders';
import { Plus, Minus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';

interface OrderItemLocal {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export function NewOrderForm() {
  const navigate = useNavigate();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const { data: products, isLoading: productsLoading } = useProducts();
  const createOrder = useCreateOrder();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [branchId, setBranchId] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItemLocal[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');

  const addProduct = () => {
    if (!selectedProduct) return;

    const product = products?.find((p) => p.id === selectedProduct);
    if (!product) return;

    const existingItem = orderItems.find((item) => item.productId === selectedProduct);

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.productId === selectedProduct
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice,
              }
            : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          totalPrice: product.price,
        },
      ]);
    }
    setSelectedProduct('');
  };

  const updateQuantity = (productId: string | undefined, delta: number) => {
    setOrderItems(
      orderItems.map((item) => {
        if (item.productId === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string | undefined) => {
    setOrderItems(orderItems.filter((item) => item.productId !== productId));
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !customerName ||
      !customerPhone ||
      !branchId ||
      !pickupDate ||
      !pickupTime ||
      orderItems.length === 0
    ) {
      return;
    }

    const orderData: CreateOrderData = {
      customerName,
      customerPhone,
      customerAddress: customerAddress || undefined,
      branchId,
      deliveryDate: pickupDate,
      deliveryTime: pickupTime,
      notes: notes || undefined,
      items: orderItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    createOrder.mutate(orderData, {
      onSuccess: () => {
        navigate('/orders');
      },
    });
  };

  const isLoading = branchesLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Customer Information */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          معلومات العميل
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="customerName">اسم العميل *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="أدخل اسم العميل"
              className="text-right"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerPhone">رقم الجوال *</Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="text-right"
              dir="ltr"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customerAddress">العنوان (اختياري)</Label>
            <Input
              id="customerAddress"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="أدخل عنوان العميل"
              className="text-right"
            />
          </div>
        </div>
      </div>

      {/* Branch & Pickup */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">الفرع وموعد الاستلام</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>الفرع *</Label>
            <Select value={branchId} onValueChange={setBranchId} required>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفرع" />
              </SelectTrigger>
              <SelectContent>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickupDate">تاريخ الاستلام *</Label>
            <Input
              id="pickupDate"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickupTime">وقت الاستلام *</Label>
            <Input
              id="pickupTime"
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">المنتجات</h2>

        {/* Add Product */}
        <div className="flex gap-4 mb-6">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="اختر المنتج" />
            </SelectTrigger>
            <SelectContent>
              {products
                ?.filter((p) => p.is_active !== false)
                .map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.price} ر.س
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={addProduct} className="gradient-gold text-white">
            <Plus className="w-4 h-4 ml-1" />
            إضافة
          </Button>
        </div>

        {/* Order Items */}
        {orderItems.length > 0 ? (
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">{item.unitPrice} ر.س للوحدة</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.productId, -1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.productId, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="font-bold w-24 text-left">{item.totalPrice} ر.س</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between items-center p-4 rounded-xl bg-primary/10 border border-primary/20">
              <span className="text-lg font-bold">الإجمالي</span>
              <span className="text-2xl font-bold text-primary">{totalAmount} ر.س</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>لم يتم إضافة منتجات بعد</p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">ملاحظات</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي ملاحظات إضافية على الطلب..."
          className="min-h-[100px]"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => navigate('/orders')}>
          إلغاء
        </Button>
        <Button
          type="submit"
          className="gradient-gold text-white px-8"
          disabled={createOrder.isPending}
        >
          {createOrder.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          إنشاء الطلب
        </Button>
      </div>
    </form>
  );
}
