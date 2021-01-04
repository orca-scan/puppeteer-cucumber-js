Feature: Book and Orca Scan demo
  As an internet user
  I want to be able to book an Orca Scan product demo
  
  Scenario: Book an Orca Scan demo
    Given I am on the Orca Scan barcode app website
    When I click the "Book a demo" button
    Then I should be able to book an "Orca Scan Demo"