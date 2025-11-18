import Card from "../components/UI/Card";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";

export default function Checkout({ booking, onConfirm }) {
  const gig = booking?.gig;
  const price = booking?.price ?? gig?.price ?? 0;

  const serviceFee = +(price * 0.06).toFixed(2);
  const total = (price + serviceFee).toFixed(2);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Confirm Booking</h1>

      <Card className="p-6 space-y-4">

        {/* SUMMARY */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="font-semibold mb-1">Job Summary</div>
            <div className="text-sm text-neutral-600">
              {gig?.title} • {booking?.dateTime} • {booking?.address}
            </div>

            <div className="rounded-xl bg-neutral-50 p-3 mt-2 text-sm">
              Provider: {gig?.provider} • ★{gig?.rating} ({gig?.reviews})
            </div>
          </div>

          {/* PAYMENT */}
          <div className="space-y-2">
            <div className="font-semibold">Payment</div>

            <Input placeholder="Card number" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="MM/YY" />
              <Input placeholder="CVC" />
            </div>
          </div>
        </div>

        {/* PRICE */}
        <div className="bg-neutral-50 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Service Fee</span>
            <span>${serviceFee}</span>
          </div>

          <div className="h-px bg-neutral-300" />

          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </div>

        {/* CONFIRM */}
        <Button className="w-full" onClick={onConfirm}>
          Place Order • Hold Payment
        </Button>
      </Card>
    </div>
  );
}
