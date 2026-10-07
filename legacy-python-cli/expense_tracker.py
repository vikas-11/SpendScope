from expense import Expense


def main():
    print(f"Running Expense Tracker")
    expense_file_path = "expense.csv"
    budget = 2000
    
    #Get User input for Expense
    #expense = get_user_expense()

    # Write their expense to a file
    #save_expense_to_file(expense, expense_file_path)
    
    # Read file and summarize expense
    summarize_expense(expense_file_path, budget)


def get_user_expense():
    print("Getting User Expense")
    expense_name = input("Enter expense name:")
    expense_amount = input("Enter expense amount:")
    
    expense_categories = [
        "Food", "Home", "Work", "Fun", "Misc",
    ]
    
    while True:
        print("Select a Catrgory:")
        for i, category_name in enumerate(expense_categories):
            print(f" {i+1}. {category_name}")
            
        value_range = f"[1 - {len(expense_categories)}]"
        selected_index = int(input("Enter a Category Number {value_range}:")) -1
        
        if i in range(len(expense_categories)):
            selected_category = expense_categories[selected_index]
            new_expense = Expense(name=expense_name, category=selected_category, amount=expense_amount)
            return new_expense
        else:
            print("Invalid Category. Please try again")
        break
    
def save_expense_to_file(expense: Expense, expense_file_path):
    print(f"Saving User Expense: {expense} to {expense_file_path}")
    with open(expense_file_path, "a") as f:
        f.write(f"{expense.name},{expense.category},{expense.amount}\n")
    
    
def summarize_expense(expense_file_path, budget):
    print("Summarize User Expense")
    expenses:list[Expense] = []
    with open(expense_file_path, "r") as f:
        lines =  f.readlines()
        for line in lines:
            expense_name, expense_category, expense_amount = line.strip().split(",")
            line_expense = Expense(
                name=expense_name, amount=float(expense_amount), category=expense_category
            )
            expenses.append(line_expense)

    amount_by_category = {}
    for expense in expenses:
        key = expense.category
        if key in amount_by_category:
            amount_by_category[key] += expense.amount
        else:
            amount_by_category[key] = expense.amount
            
    print("Expenses By Category: ")
    for key, amount in amount_by_category.items():
        print(f"..{key}: ${amount}")
        
    total_spent = sum([x.amount for x in expenses])
    print(f"You've spent ${total_spent} this month!")

    remaining_budget = budget - total_spent
    print(f"Budget Remaning ${remaining_budget} this month!")
if __name__ == "__main__":
    main()