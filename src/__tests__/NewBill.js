/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom/extend-expect";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    ////// Tâche 3[Tests unitaires et d’intégration]
    // Icone mail active
    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon).toHaveClass("active-icon");
    });

    ////// Tâche 3[Tests unitaires et d’intégration]
    // POST / Remplissage du formulaire, conformité du formulaire et envoi de la nouvelle note de frais
    describe("When I fill the form and submit it", () => {
      test("Then a new bill is created", async () => {
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({
          document,
          onNavigate: (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
          },
          store: mockStore,
          localStorage: localStorageMock,
        });

        const bills = await mockStore.bills().list();
        const bill = bills[0];

        const typeField = screen.getByTestId("expense-type");
        fireEvent.change(typeField, { target: { value: bill.type } });
        expect(typeField.value).toBe(bill.type);

        const nameField = screen.getByTestId("expense-name");
        fireEvent.change(nameField, { target: { value: bill.name } });
        expect(nameField.value).toBe(bill.name);

        const dateField = screen.getByTestId("datepicker");
        fireEvent.change(dateField, { target: { value: bill.date } });
        expect(dateField.value).toBe(bill.date);

        const amountField = screen.getByTestId("amount");
        fireEvent.change(amountField, { target: { value: bill.amount } });
        expect(parseInt(amountField.value)).toBe(parseInt(bill.amount));

        const vatField = screen.getByTestId("vat");
        fireEvent.change(vatField, { target: { value: bill.vat } });
        expect(parseInt(vatField.value)).toBe(parseInt(bill.vat));

        const pctField = screen.getByTestId("pct");
        fireEvent.change(pctField, { target: { value: bill.pct } });
        expect(parseInt(pctField.value)).toBe(parseInt(bill.pct));

        const commentaryField = screen.getByTestId("commentary");
        fireEvent.change(commentaryField, {
          target: { value: bill.commentary },
        });
        expect(commentaryField.value).toBe(bill.commentary);

        const fileField = screen.getByTestId("file");
        fireEvent.change(fileField, {
          target: {
            files: [
              new File([bill.fileName], bill.fileUrl, { type: "image/png" }),
            ],
          },
        });
        expect(fileField.files[0].name).toBe(bill.fileUrl);
        expect(fileField.files[0].type).toBe("image/png");

        const handleSubmit = jest.fn(newBill.handleSubmit);
        const submitBtn = screen.getByTestId("form-new-bill");

        submitBtn.addEventListener("submit", handleSubmit);
        submitBtn.dispatchEvent(new Event("submit"));

        expect(handleSubmit).toHaveBeenCalled();
      });
    });
  });
});
