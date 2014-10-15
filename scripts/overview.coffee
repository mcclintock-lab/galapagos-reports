ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
d3 = window.d3

class OverviewTab extends ReportTab
  name: 'overview'
  className: 'overview'
  template: templates.overview
  dependencies:[ 
    'Size'
  ]
  render: () ->
    # create random data for visualization
    #size_km = @recordSet("Size", "SIZE_KM").toFloat()
    size_km = 45.0
    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      size_km: size_km
    
    @$el.html @template.render(context, templates)

    # Setup bootstrap tabs
    @$('#tabs2 a').click (e) ->
      console.log 'tab click'
      e.preventDefault()
      $(this).tab('show')



module.exports = OverviewTab