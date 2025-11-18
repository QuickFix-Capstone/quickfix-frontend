// src/pages/Logout.jsx
import React from "react";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";

export default function Logout({ onConfirm, onCancel }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
      <Card className="w-full p-6 space-y-4 text-center">
        <h1 className="text-xl font-semibold">Logout</h1>
        <p className="text-sm text-neutral-600">
          Are you sure you want to logout from QuickFix?
        </p>
        <div className="mt-4 flex gap-2 justify-center">
          <Button onClick={onConfirm}>Yes, logout</Button>
          <button
            type="button"
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </Card>
    </div>
  );
}
