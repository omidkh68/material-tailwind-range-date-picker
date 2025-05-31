# 📅 Material Tailwind Range Date Picker

A customizable **Date Range Picker** built with **Angular 20**, **Angular Material**, and **Tailwind CSS v4**, supporting **two-way binding**, **date-time offsets**, and a clean modern UI.

---

## ✨ Features

- ✅ Built with **Angular v20**
- 🎨 Styled using **Tailwind CSS v4**
- 🧱 Uses latest **Angular Material** components
- 🕑 Supports **date & time selection**
- 🔄 **Two-way binding** for start and end date-times
- 🧭 Handles **offsets** and timezone adjustments
- 📦 Lightweight, responsive, and easy to integrate

---

## 🚀 Getting Started

### Clone the repo
```bash
git clone https://github.com/omidkh68/material-tailwind-range-date-picker.git
cd material-tailwind-range-date-picker
```

### Install dependencies
```bash
npm install
```

### Run the app locally
```bash
ng serve
```

Then visit [http://localhost:4200](http://localhost:4200)

---

## 🛠 Technologies Used

| Tool            | Version         |
|-----------------|-----------------|
| Angular         | ^20             |
| Angular Material| latest          |
| Tailwind CSS    | ^4              |
| TypeScript      | ^5              |

---

## 📚 How to Use

### 1. Add the `DateSelectorComponent` in your template
```html
<app-date-selector
  [startDate]="start"
  [endDate]="end"
  (startDateChange)="onStartChange($event)"
  (endDateChange)="onEndChange($event)">
</app-date-selector>
```

### 2. Bind your variables in the component
```ts
start = new Date();
end = new Date();

onStartChange(date: Date) {
  this.start = date;
}

onEndChange(date: Date) {
  this.end = date;
}
```

### 3. Offset Support
All date-times are internally normalized using offset logic (e.g., UTC+X), making it ideal for systems with timezone-aware data.

---

## 📷 Screenshots

*(Add your UI screenshots here once ready)*

---

## 📄 License

MIT License © 2025 [YOUR NAME]

---

## 🙌 Contributions

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
