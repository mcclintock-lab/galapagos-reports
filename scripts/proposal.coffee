OverviewTab = require './overview.coffee'
TradeoffsTab = require './tradeoffs.coffee'

window.app.registerReport (report) ->
  report.tabs [OverviewTab, TradeoffsTab]
  # path must be relative to dist/
  report.stylesheets ['./proposal.css']

