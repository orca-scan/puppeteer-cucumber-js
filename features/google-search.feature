@search
Feature: Searching for barcode scanner app
  As an internet user
  In order to learn out more about barcode scanner apps
  I want to be able to search google and find the results
  
  Scenario: Google search for barcode scanner app
    When I search Google for "Orca Scan"
    Then I should see "Orca Scan" in the results