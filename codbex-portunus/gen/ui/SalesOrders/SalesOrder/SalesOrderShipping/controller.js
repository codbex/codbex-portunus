angular.module('page', ["ideUI", "ideView", "entityApi"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'codbex-portunus.SalesOrders.SalesOrderShipping';
	}])
	.config(["entityApiProvider", function (entityApiProvider) {
		entityApiProvider.baseUrl = "/services/js/codbex-portunus/gen/api/SalesOrders/SalesOrderShipping.js";
	}])
	.controller('PageController', ['$scope', '$http', 'messageHub', 'entityApi', function ($scope, $http, messageHub, entityApi) {

		//-----------------Custom Actions-------------------//
		$http.get("/services/js/resources-core/services/custom-actions.js?extensionPoint=codbex-portunus-custom-action").then(function (response) {
			$scope.pageActions = response.data.filter(e => e.perspective === "SalesOrders" && e.view === "SalesOrderShipping" && (e.type === "page" || e.type === undefined));
			$scope.entityActions = response.data.filter(e => e.perspective === "SalesOrders" && e.view === "SalesOrderShipping" && e.type === "entity");
		});

		$scope.triggerPageAction = function (actionId) {
			for (const next of $scope.pageActions) {
				if (next.id === actionId) {
					messageHub.showDialogWindow("codbex-portunus-custom-action", {
						src: next.link,
					});
					break;
				}
			}
		};

		$scope.triggerEntityAction = function (actionId, selectedEntity) {
			for (const next of $scope.entityActions) {
				if (next.id === actionId) {
					messageHub.showDialogWindow("codbex-portunus-custom-action", {
						src: `${next.link}?id=${selectedEntity.Id}`,
					});
					break;
				}
			}
		};
		//-----------------Custom Actions-------------------//

		function resetPagination() {
			$scope.dataPage = 1;
			$scope.dataCount = 0;
			$scope.dataLimit = 10;
		}
		resetPagination();

		//-----------------Events-------------------//
		messageHub.onDidReceiveMessage("codbex-portunus.SalesOrders.SalesOrder.entitySelected", function (msg) {
			resetPagination();
			$scope.selectedMainEntityId = msg.data.selectedMainEntityId;
			$scope.loadPage($scope.dataPage);
		}, true);

		messageHub.onDidReceiveMessage("codbex-portunus.SalesOrders.SalesOrder.clearDetails", function (msg) {
			$scope.$apply(function () {
				resetPagination();
				$scope.selectedMainEntityId = null;
				$scope.data = null;
			});
		}, true);

		messageHub.onDidReceiveMessage("clearDetails", function (msg) {
			$scope.$apply(function () {
				$scope.entity = {};
				$scope.action = 'select';
			});
		});

		messageHub.onDidReceiveMessage("entityCreated", function (msg) {
			$scope.loadPage($scope.dataPage);
		});

		messageHub.onDidReceiveMessage("entityUpdated", function (msg) {
			$scope.loadPage($scope.dataPage);
		});
		//-----------------Events-------------------//

		$scope.loadPage = function (pageNumber) {
			let SalesOrder = $scope.selectedMainEntityId;
			$scope.dataPage = pageNumber;
			entityApi.count(SalesOrder).then(function (response) {
				if (response.status != 200) {
					messageHub.showAlertError("SalesOrderShipping", `Unable to count SalesOrderShipping: '${response.message}'`);
					return;
				}
				$scope.dataCount = response.data;
				let query = `SalesOrder=${SalesOrder}`;
				let offset = (pageNumber - 1) * $scope.dataLimit;
				let limit = $scope.dataLimit;
				entityApi.filter(query, offset, limit).then(function (response) {
					if (response.status != 200) {
						messageHub.showAlertError("SalesOrderShipping", `Unable to list SalesOrderShipping: '${response.message}'`);
						return;
					}
					$scope.data = response.data;
				});
			});
		};

		$scope.selectEntity = function (entity) {
			$scope.selectedEntity = entity;
		};

		$scope.openDetails = function (entity) {
			$scope.selectedEntity = entity;
			messageHub.showDialogWindow("SalesOrderShipping-details", {
				action: "select",
				entity: entity,
				optionsZone: $scope.optionsZone,
				optionsCountry: $scope.optionsCountry,
			});
		};

		$scope.createEntity = function () {
			$scope.selectedEntity = null;
			messageHub.showDialogWindow("SalesOrderShipping-details", {
				action: "create",
				entity: {},
				selectedMainEntityKey: "SalesOrder",
				selectedMainEntityId: $scope.selectedMainEntityId,
				optionsZone: $scope.optionsZone,
				optionsCountry: $scope.optionsCountry,
			}, null, false);
		};

		$scope.updateEntity = function (entity) {
			messageHub.showDialogWindow("SalesOrderShipping-details", {
				action: "update",
				entity: entity,
				selectedMainEntityKey: "SalesOrder",
				selectedMainEntityId: $scope.selectedMainEntityId,
				optionsZone: $scope.optionsZone,
				optionsCountry: $scope.optionsCountry,
			}, null, false);
		};

		$scope.deleteEntity = function (entity) {
			let id = entity.Id;
			messageHub.showDialogAsync(
				'Delete SalesOrderShipping?',
				`Are you sure you want to delete SalesOrderShipping? This action cannot be undone.`,
				[{
					id: "delete-btn-yes",
					type: "emphasized",
					label: "Yes",
				},
				{
					id: "delete-btn-no",
					type: "normal",
					label: "No",
				}],
			).then(function (msg) {
				if (msg.data === "delete-btn-yes") {
					entityApi.delete(id).then(function (response) {
						if (response.status != 204) {
							messageHub.showAlertError("SalesOrderShipping", `Unable to delete SalesOrderShipping: '${response.message}'`);
							return;
						}
						$scope.loadPage($scope.dataPage);
						messageHub.postMessage("clearDetails");
					});
				}
			});
		};

		//----------------Dropdowns-----------------//
		$scope.optionsZone = [];
		$scope.optionsCountry = [];

		$http.get("/services/js/codbex-portunus/gen/api/Settings/Zone.js").then(function (response) {
			$scope.optionsZone = response.data.map(e => {
				return {
					value: e.Id,
					text: e.Name
				}
			});
		});

		$http.get("/services/js/codbex-portunus/gen/api/Settings/Country.js").then(function (response) {
			$scope.optionsCountry = response.data.map(e => {
				return {
					value: e.Id,
					text: e.Name
				}
			});
		});
		$scope.optionsZoneValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsZone.length; i++) {
				if ($scope.optionsZone[i].value === optionKey) {
					return $scope.optionsZone[i].text;
				}
			}
			return null;
		};
		$scope.optionsCountryValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsCountry.length; i++) {
				if ($scope.optionsCountry[i].value === optionKey) {
					return $scope.optionsCountry[i].text;
				}
			}
			return null;
		};
		//----------------Dropdowns-----------------//

	}]);
